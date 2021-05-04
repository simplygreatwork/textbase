
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
		this.changes = []
	}
	
	sanitize(html) {
		
		let top = u(html).first()
		this.walker.walk(top)
		this.changes.forEach(function(each) {
			if (each.length === 1) {
				u(each[0]).remove()
			} else {
				u(each[0]).replace(each[1])
			}
		})
		return top.outerHTML
	}
	
	configure(bus) {
		
		bus.on('element', function(node) {
			if (is_editable_node(node)) {
				bus.emit('element-editable', node)
				bus.emit(`element-editable:${node.tagName.toLowerCase()}`, node)
			} else {
				bus.emit('element-non-editable', node)
				bus.emit(`element-non-editable:${node.tagName.toLowerCase()}`, node)
			}
		}.bind(this))
		
		bus.on('element-editable:b', (node) => this.changes.push([node, u('<span class="strong">')]))
		bus.on('element-editable:i', (node) => this.changes.push([node, u('<span class="emphasis">')]))
		bus.on('element-editable:script', (node) => this.changes.push([node]))
		bus.on('element-editable:table', (node) => this.changes.push([node]))
		
		bus.on('element-editable', function(node) {
			if (node.tagName == 'b') this.changes.push([node, u('<span class="strong">')])
			if (node.tagName == 'i') this.changes.push([node, u('<span class="emphasis">')])
			if (node.tagName == 'script') this.changes.push([node])
			if (node.tagName == 'table') this.changes.push([node])
		}.bind(this))
		
		bus.on('element-non-editable', function(node) {
			if (node.tagName == 'script') this.changes.push(node)
		}.bind(this))
	}
}
