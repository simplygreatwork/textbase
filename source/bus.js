
import { Logger } from './logger.js'

const logger = Logger()

export class Bus {
	
	on(key, func, unshift) {
		
		this.channels = this.channels || {}
		if (this.channels[key] === undefined) this.channels[key] = []
		if (unshift) this.channels[key].unshift(func)
		else this.channels[key].push(func)
		return function off() {
			let index = this.channels[key].indexOf(func)
			this.channels[key].splice(index, 1)
		}.bind(this)
	}
	
	emit(key) {
		
		this.channels = this.channels || {}
		if (this.channels[key]) {
			let arguments_ = Array.from(arguments)
			arguments_ = arguments_.splice(1)
			let state = {}
			arguments_.push(this.interruptable(state))
			this.emit_(key, 0, arguments_, state)
		}
	}
	
	emit_(key, index, arguments_, state) {
		
		let channel = this.channels[key]
		if (state.interrupted) {
			logger('bus').log(`Interrupting bus at ${index} of ${channel.length}`)
			return
		}
		if (index < channel.length) {
			channel[index].apply(this, arguments_)
			this.emit_(key, ++index, arguments_, state)
		}
	}
	
	interruptable(state) {
		
		return function() {
			state.interrupted = true
		}
	}
	
	unshift(key, func) {
		this.on(key, func, true)
	}
	
	replace(key, index, fn) {
		
		if (index < this.channels[key].length) {
			this.channels[key][index] = fn
		}
	}
	
	remap(from, to) {
		
		this.channels[to] = this.channels[from]
		delete this.channels[from]
	}
}
