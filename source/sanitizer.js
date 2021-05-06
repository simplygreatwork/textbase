
import { an_element_node, a_text_node } from './basics.js'
import { is_editable_node } from './basics.js'
import { text_iterator } from './basics.js'
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Sanitizer {
	
	constructor(editor) {
		
		this.bus = editor.bus
		this.walker = new Walker(this.bus)
		this.configure(this.bus)
	}
	
	sanitize(html) {
		
		let paths = this.collect_paths(html)
		if (false) this.print_paths(paths)
		let tree = this.build_tree(paths)
		if (false) this.print_tree(tree)
		return tree.html()
	}
	
	collect_paths(html) {
		
		let bus = this.bus
		let source = u(`<div><div data-role="top">${html}</div></div>`).first()
		let paths = []
		let text_node_previous = null
		for_each_significant_text_node(source, function(text_node) {
			let path = []
			let seeking = true
			let node = u(text_node).parent()
			path.unshift(text_node)
			while (seeking) {
				let closest = u(node).closest('div,p,h1,h2,li,span,a,code,b,i')
				if (closest.data('role') == 'top') closest = u('<p>')
				path.unshift(closest.first())
				if (closest.is('div,p,h1,h2,li')) seeking = false
				node = closest.parent().first()
				if (! u(node).parent().first()) seeking = false 
			}
			paths.push(path)
		})
		return paths
	}
	
	print_paths(paths) {
		
		paths.forEach(function(path) {
			let tags = []
			path.forEach(function(node) {
				if (node.nodeType === 1) {
					tags.push(node.tagName.toLowerCase())
				} else {
					tags.push('text:' + node.nodeValue.trim())
				}
			})
			console.log('path: ' + tags.join(' > '))
		})
	}
	
	build_tree(paths) {
		
		let tree = u('<div>')
		paths.forEach(function(path) {
			let clone = [...path]
			this.inject_path(clone, tree.first())
		}.bind(this))
		return tree
	}
	
	print_tree(tree) {
		
		tree.children().each(function(each) {
			console.log(each.outerHTML)
		})
	}
	
	inject_path(path, node) {
		
		let original = path.shift()
		let node_ = original.cloneNode()
		if (u(node_).is(an_element_node)) {
			if (! u(node_).is('p,h1,h2,li,span,a,code,b,i')) node_ = u('<p>').first()
			if (! node.contains(original)) u(node).append(node_)
		} else if (u(node_).is(a_text_node)) {
			let text = node_.nodeValue.trim()
			if (text.length > 0) {
				if (u(node).is('span')) {
					u(node).append(text)
				} else {
					u(node).append(`<span>${text}</span>`)
				}
			}
		}
		if (path.length > 0) this.inject_path(path, node_)
	}
	
	configure(bus) {
		return
	}
	
	sanitize_deprecated(html) {
		
		let bus = this.bus
		let source = u(`<div><div>${html}</div></div>`)
		let destination = u('<div>')
		let path = [[]]
		let text_node_previous = null
		for_each_significant_text_node(source, function(text_node) {
			if (! is_same_block(text_node, text_node_previous)) {
				destination.append(path[0]).append('\n')
				path = [create_block(text_node, bus)]
			}
			let closest = u(text_node).parent().closest('a,code')
			let text = text_node.nodeValue.trim()
			let inline = create_inline(text_node, bus)
			path[path.length - 1].append(inline)
			text_node_previous = text_node
		})
		destination.append(path[0]).append('\n')
		return destination.html()
	}
	
	example() {
		
		logger('sanitizer').log('sanitized: ')
		logger('sanitizer').log(this.sanitize(`
			top-text
			<p>
				p-text
				<span>p-span-text</span>
				<a href="http://github.com">
					<span>p-a-span-text</span>
					<span>p-a-span-text</span>
				</a>
			</p>
			<omit>
				omit-text
				<h1>omit-h1-text</h1>
				omit-text
				<span>omit-span-text</span>
				<b>omit-bold-text</b>
				<span>omit-span-text</span>
			</omit>
			<h1>h1-text</h1>
			<h2>h2-text</h2>
			<li><b>li-text</b></li>
			<ul>
				<li>li-text</li>
				<li>li-text</li>
			</ul>
			<script></script>
			<table></table>
			<b>bold-text</b>
			<i>italic-text</i>
			<div contentEditable="false">
				<script></script>
				<table></table>
				<b>div-bold-text</b>
				<i>div-italic-text</i>
			</div>
		`))
	}
}

function for_each_significant_text_node(source, fn) {
	
	let iterator = text_iterator(source, source)
	let node = iterator.nextNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) fn(node)
		node = iterator.nextNode()
	}
}

function is_same_block(a, b) {
	
	if (a === null) return false
	if (b === null) return false
	return closest_(a) == closest_(b)
}

function create_block(node, bus) {
	
	let tag = 'p'
	let closest = closest_(node)
	if (closest) tag = closest.tagName.toLowerCase()
	if (! 'p h1 h2 li'.split(' ').includes(tag)) tag = 'p' 
	return u(`<${tag}>`)
}

function create_inline(node, bus) {
	
	let from = node
	let to = u(`<span>${from.nodeValue.trim()}</span>`)
	apply_class(from, 'b', to, 'strong')
	apply_class(from, 'i', to, 'emphasis')
	let data = { from: from, to: to.first() }
	bus.emit('sanitize', data)										// for inline atom transformations: a, code, etc
	return u(data.to)													// issue: <a>, <code> could contain multiple text nodes
}

function apply_class(text_node, tag, node, class_) {
	
	let parent = u(text_node).parent()
	let closest = parent.closest(tag).first()
	if (closest) node.addClass(class_)
}

function closest_(node) {
	
	return u(node).parent().closest('div,p,h1,h2,li').first()
}
