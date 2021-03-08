
export class Bus {
	
	on(key, func) {
		
		this.channels = this.channels || {}
		if (this.channels[key] === undefined) this.channels[key] = []
		this.channels[key].push(func)
		return function off() {
			let index = this.channels[key].indexOf(func)
			this.channels[key].splice(index, 1)
		}.bind(this)
	}
	
	emit(key) {
		
		this.channels = this.channels || {}
		if (this.channels[key]) {
			var index = this.channels[key].length
			while (index--) {
				this.channels[key][index].apply(this, Array.from(arguments).splice(1))
			}
		}
	}
	
	replace(key, index, fn) {
		
		if (index < this.channels[key].length) {
			this.channels[key][index] = fn
		}
	}
}
