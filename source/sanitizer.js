
import { is_editable_node } from './basics.js'
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Sanitizer {
	
	constructor(editor) {
		
		this.walker = new Walker()
		this.bus = this.walker.bus
		this.configure(this.bus)
	}
	
	sanitize(html) {
		
		let source = u(`<div><div>${html}</div></div>`)
		let destination = u('<div>')
		let block = []
		let last_text_node = null
		source.find().contents().each(function(node) {
			if (! is_significant_text_node(node)) return
			let text_node = node
			if (! is_same_block(text_node, last_text_node)) {
				destination.append(block).append('\n')
				block = create_block(text_node)
			}
			let text = text_node.nodeValue.trim()
			let inline = create_inline(text_node)
			block.append(inline)
			last_text_node = text_node
		})
		destination.append(block).append('\n')
		return destination.html()
	}
	
	configure(bus) {
		return
	}
	
	example() {
		
		logger('sanitizer').log('sanitized: ')
		logger('sanitizer').log(this.sanitize(`
			top-text
			<p>
				p-text
				<span>p-span-text</span>
				<span>p-span-text</span>
				<span>p-span-text</span>
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

function is_significant_text_node(node) {
	
	if (node.nodeType == 3) {
		let text = node.nodeValue.trim()
		if (text.length > 0) {
			return true
		}
	}
	return false
}

function is_same_block(a, b) {
	
	if (a === null) return false
	if (b === null) return false
	return closest_(a) == closest_(b)
}

function create_block(node) {
	
	let tag = 'p'
	let closest = closest_(node)
	if (closest) tag = closest.tagName.toLowerCase()
	if (! 'p h1 h2 li'.split(' ').includes(tag)) tag = 'p' 
	return u(`<${tag}>`)
}

function create_inline(text_node) {
	
	let node = u(`<span>${text_node.nodeValue.trim()}</span>`)
	apply_class(text_node, 'b', node, 'strong')
	apply_class(text_node, 'i', node, 'emphasis')
	return node
}

function apply_class(text_node, tag, node, class_) {
	
	let parent = u(text_node).parent()
	let closest = parent.closest(tag).first()
	if (closest) node.addClass(class_)
}

function closest_(node) {
	
	return u(node).parent().closest('div,p,h1,h2,li').first()
}
