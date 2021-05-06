
import { an_element_node, a_text_node } from './basics.js'
import { text_iterator } from './basics.js'
import { Bus } from './bus.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Sanitizer {
	
	constructor(editor) {
		
		let bus = this.bus = editor.bus
		this.printing(false, bus)
	}
	
	sanitize(html) {
		
		let bus = this.bus
		let paths = this.collect_paths(html, bus)
		let tree = this.build_tree(paths, bus)
		tree = this.convert_tree(tree, bus)
		return tree.html()
	}
	
	collect_paths(html, bus) {
		
		let paths = []
		let source = u(`<div><div>${html}</div></div>`).first()
		each_significant_text_node(source, function(text_node) {
			let path = []
			path.unshift(text_node)
			let node = u(text_node).parent()
			let seeking = true
			while (seeking) {
				let closest = u(node).closest('div,p,h1,h2,li,span,a,code')
				if (closest.is('div')) closest = u('<p>')
				path.unshift(closest.first())
				if (closest.is('div,p,h1,h2,li')) seeking = false
				node = closest.parent().first()
				if (! node) seeking = false
			}
			paths.push(path)
		})
		bus.emit('sanitized-paths-collected', paths)
		return paths
	}
	
	build_tree(paths, bus) {
		
		let tree = u('<div>')
		paths.forEach(function(path) {
			let clone = [...path]
			this.inject_path(clone, tree.first())
		}.bind(this))
		bus.emit('sanitized-tree-built', tree)
		return tree
	}
	
	inject_path(path, node) {
		
		let original = path.shift()
		let node_ = original.mirror = original.mirror || this.create_element(original)
		if (u(node_).is(an_element_node)) {
			if (! node.contains(node_)) u(node).append(node_)
		} else if (u(node_).is(a_text_node)) {
			let text = node_.nodeValue.trim()
			if (text.length > 0) {
				if (u(node).is('span')) {
					u(node).append(text)
				} else {
					u(node).append(node = u(`<span>${text}</span>`).first())
				}
				apply_format(original, 'b', node, 'strong')
				apply_format(original, 'i', node, 'emphasis')
			}
		}
		if (path.length > 0) this.inject_path(path, node_)
	}
	
	create_element(original) {
		
		if (u(original).is(an_element_node)) {
			return document.createElement(original.tagName)
		} else {
			return original.cloneNode()
		}
	}
	
	convert_tree(tree, bus) {
		
		u(tree).find('a,code').each(function(each) {									// for transformation to atoms
			let data = { node: each }
			let tag = each.tagName.toLowerCase()
			bus.emit(`convert:${tag}`, data)
			if (data.node != each) u(each).replace(data.node)
		})
		return tree
	}
	
	printing(enabled, bus) {
		
		if (! enabled) return
		bus.on('sanitized-paths-collected', function(paths) {
			this.print_paths(paths)
		}.bind(this))
		bus.on('sanitized-tree-built', function(tree) {
			this.print_tree(tree)
		}.bind(this))
	}
	
	print_paths(paths) {
		
		paths.forEach(function(path) {
			let tags = []
			path.forEach(function(node) {
				if (u(node).is(an_element_node)) {
					tags.push(node.tagName.toLowerCase())
				} else if (u(node).is(a_text_node)) {
					tags.push(`text:${node.nodeValue.trim()}`)
				}
			})
			console.log(`path: ${tags.join(' > ')}`)
		})
	}
	
	print_tree(tree) {
		
		tree.children().each(function(each) {
			console.log(each.outerHTML)
		})
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
				<code>
					<span>p-code-span-text</span>
				</code>
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

function each_significant_text_node(source, fn) {
	
	let iterator = text_iterator(source, source)
	let node = iterator.nextNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) fn(node)
		node = iterator.nextNode()
	}
}

function apply_format(original, tag, node, class_) {
	
	if (u(original).parent().closest(tag).first()) u(node).addClass(class_)
}
