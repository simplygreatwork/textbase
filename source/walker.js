
import { Bus } from './bus.js'
import { node_iterator } from './basics.js'

export class Walker {
	
	constructor() {
		
		this.bus = new Bus()
	}
	
	walk(root, from, to) {
		
		from = from || root
		let node = from
		let iterator = node_iterator(root, root)
		let index = 0
		while (node) {
			if (node.nodeType === 1) {
				this.emit('element', node)
			} else if (node.nodeType === 3) {
				this.emit('text', node)
			}
			if (to && node == to) break
			node = iterator.nextNode()
			index++
		}
	}
	
	on(key, fn) {
		return this.bus.on(key, fn)
	}
	
	emit(message, data) {
		return this.bus.emit(message, data)
	}
}
