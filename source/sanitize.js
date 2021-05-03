
import { is_editable_node } from './basics.js'
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Sanitizer {
	
	constructor(editor) {
		
		this.walker = new Walker()
		this.configure(this.walker.bus)
		this.blacklist = []
	}
	
	sanitize(html) {
		
		logger('sanitize').log('sanitizing...')
		let top = u(html).first()
		this.walker.walk(top)
		this.blacklist.forEach(function(each) {
			u(each).remove()
		})
		return top.outerHTML
	}
	
	configure(bus) {
		
		bus.on('element', function(node) {
			if (is_editable_node(node)) {
				bus.emit('element:editable', node)
			} else {
				bus.emit('element:non-editable', node)
			}
		}.bind(this))
		
		bus.on('element:editable', function(node) {
			if (node.tagName == 'I') this.blacklist.push(node)
		}.bind(this))
		
		bus.on('element:editable', function(node) {
			if (node.tagName == 'SCRIPT') this.blacklist.push(node)
		}.bind(this))
		
		bus.on('element:non-editable', function(node) {
			if (node.tagName == 'SCRIPT') this.blacklist.push(node)
		}.bind(this))
	}
}
