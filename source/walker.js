
import { Bus } from './bus.js'

export class Walker {
	
	constructor() {
		
		this.bus = new Bus()
	}
	
	walk(node) {
		
		this.walk_(u(node), 0)
	}
	
	walk_(node, level) {
		
		level++
		node.contents().each(function(each) {
			if (each.nodeType === 1) {
				this.emit('enter', each, level)
				this.walk_(u(each), level)
				this.emit('exit', each, level)
			} else if (each.nodeType === 3) {
				this.emit('text', each)
			}
		}.bind(this))
		level--
	}
	
	on(key, fn) {
		return this.bus.on(key, fn)
	}
	
	emit(message, data) {
		return this.bus.emit(message, data)
	}
}
