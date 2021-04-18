
import { Logger } from './logger.js'

const logger = Logger()

// when creating a bus, call: this.bus = Bus.create().context('main')
// or internally Bus.create can return bus.context('main')
// never pass a context to emit
// but when emitting, cycle thrugh active contexts of the set
// context('code-card') is simply sugar
// so then every function will expect a context
// if you happen to call bus.context('code-card').emit() - will emit to all anyway?

// actually: bus.on('select', fn, 'context')
// actually: bus.unshift('select', fn, 'context')

// let bus = Bus.create()
// bus.on('card-did-enter', function() {})
// bus.on('card-did-enter', function() {}, 'card-code')
// bus.context('card-code').on('card-did-enter', function() {})
// bus.contexts.add('card-code')
// bus.context('card-code').emit('card-did-enter', ...)
// bus.contexts.delete('card-code')

export class Bus {
	
	constructor() {
		
		this.contexts = new Set()
		this.contexts.add('main')
		this.channels = {}
	}
	
	on(key, fn, context) {
		
		context = context || 'main'
		this.channels = this.channels || {}
		this.channels[context] = this.channels[context] || {}
		this.channels[context][key] = this.channels[context][key] || []
		this.channels[context][key].push(fn)
		return function off() {
			let index = this.channels[context][key].indexOf(fn)
			this.channels[context][key].splice(index, 1)
		}.bind(this)
	}
	
	unshift(key, func, context) {
		
		context = context || 'main'
		this.channels = this.channels || {}
		this.channels[context] = this.channels[context] || {}
		this.channels[context][key] = this.channels[context][key] || []
		this.channels[context][key].unshift(fn)
		return function off() {
			let index = this.channels[context][key].indexOf(fn)
			this.channels[context][key].splice(index, 1)
		}.bind(this)
	}
	
	emit(key) {
		
		let state = {}
		let arguments_ = Array.from(arguments)
		arguments_ = arguments_.splice(1)
		arguments_.push(this.interruptable(state))
		iterate(key, state, function(fn) {
			fn.apply(this, arguments_)
		}.bind(this))
	}
	
	iterate(key, state, fn) {
		
		Array.fromArray(this.contexts).forEach(function(context) {
			if (! this.channels[context]) return 
			if (! this.channels[context][key]) return 
			this.channels[context][key].forEach(function(fn_) {
				if (! state.interrupted) fn(fn_)
			}.bind(this))
		}.bind(this))
	}
	
	interruptable(state) {
		
		return function() {
			state.interrupted = true
		}
	}
	
	replace(key, index, fn, context) {
		
		context = context || 'main'
		if (index < this.channels[context][key].length) {
			this.channels[context][key][index] = fn
		}
	}
	
	remap(from, to, context) {
		
		context = context || 'main'
		this.channels[context][to] = this.channels[context][from]
		delete this.channels[context][from]
	}
	
	context(context_) {
		
		return {
			on: (key, fn) => this.on(key, fn, context_),
			unshift: (key) => this.unshift(key, fn, context_),
			emit: (key) => this.emit(...arguments),
			replace: (key, index, fn) => this.replace(key, index, fn, context_),
			remap: (from, to) => this.remap(from, to, context_)
		}
	}
}
