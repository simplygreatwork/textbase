
import { System } from './system.js'
import { Storage } from './storage.js'

export class Application {
	
	constructor() {
		
		let system = new System()
		let bus = system.bus
		let storage = new Storage(bus)
		this.listen(bus, system)
		this.load_document(bus)
	}
	
	listen(bus, system) {
		
		bus.on('document:did-load', function(document_) {
			system.install_document(document_)
		}.bind(this))
		
		bus.on('document:did-save', function(status) {
			console.log('document:did-save: ' + status)
		}.bind(this))
		
		bus.on('content:did-change', function() {
			this.debounce(function() {
				system.document_.content = document.querySelector('.content').innerHTML
				bus.emit('document:did-request-save', system.document_)
			}.bind(this))
		}.bind(this))
	}
	
	load_document(bus) {
		bus.emit('document:did-request-load', this.options())
	}
	
	options() {
		
		let parameters = new URLSearchParams(document.location.search.substring(1))
		if (parameters.get('path')) {
			return {
				mutable: true,
				path: parameters.get('path'),
				token: 'token ' + parameters.get('token')
			}
		} else {
			return {
				mutable: false,
				path: './documents/all.html'
			}
		}
	}
	
	debounce(fn) {
		
		if (this.id) window.clearTimeout(this.id)
		this.id = window.setTimeout(function() {
			this.id = null
			fn()
		}.bind(this), 5000)
	}
}
