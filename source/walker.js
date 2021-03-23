
import { Bus } from './bus.js'
import { node_iterator } from './basics.js'

export class Walker {
	
	constructor() {
		
		this.bus = new Bus()
	}
	
	walk(root, begin, end) {
		
		if (! (begin && end)) {
			begin = begin || root
		}
		let node = begin
		let iterator = node_iterator(root, node)
		while (node) {
			if (node.nodeType === 1) {
				this.emit('element', node)
			} else if (node.nodeType === 3) {
				this.emit('text', node)
			}
			if (end && node == end) break
			node = iterator.nextNode()
		}
	}
	
	on() {
		return this.bus.on(...arguments)
	}
	
	emit() {
		return this.bus.emit(...arguments)
	}
}
