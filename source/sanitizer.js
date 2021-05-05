
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
		source.find().contents().each(function(each) {
			if (is_significant_text_node(each)) {
				let text_node = each
				if (! is_same_block(text_node, last_text_node)) {
					destination.append(block).append('\n')
					block = u(`<${get_block_type(text_node)}>`)
				}
				let text = each.nodeValue.trim()
				block.append(u(`<span>${text}</span>`))
				last_text_node = text_node
			}
		})
		destination.append(block).append('\n')
		return destination.html()
	}
	
	configure(bus) {
		return
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

function get_block_type(node) {
	
	let tag = 'p'
	let closest = closest_(node)
	if (closest) tag = closest.tagName.toLowerCase()
	if (! 'p h1 h2 li'.split(' ').includes(tag)) tag = 'p' 
	return tag
}

function closest_(node) {
	
	return u(node).parent().closest('div,p,h1,h2,li').first()
}
