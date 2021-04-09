
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
	
	unshift(key, func) {
		this.on(key, func, true)
	}
	
	early(key, func) {
		this.unshift(key, func)
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
	
	emit(key) {
		
		this.channels = this.channels || {}
		if (this.channels[key]) {
			let index = 0
			while (index < this.channels[key].length) {
				this.channels[key][index].apply(this, Array.from(arguments).splice(1))
				index++
			}
		}
	}
}
