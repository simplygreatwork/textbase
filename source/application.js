
import { System } from './system.js'
import { Storage } from './storage.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Application {
	
	constructor() {
		
		let system = new System()
		let bus = system.bus
		let storage = new Storage(bus)
		this.listen(bus, system, storage)
		storage.load(this.options())
	}
	
	listen(bus, system, storage) {
		
		bus.on('storage-did-load', function(document_) {
			system.install_document(document_)
		}.bind(this))
		
		bus.on('storage-did-save', function(status) {
			logger('trace').log('document:did-save: ' + status)
		}.bind(this))
		
		bus.on('content:did-change', function(begin, end) {
			this.debounce(function() {
				system.document_.content = document.querySelector('.content').innerHTML
				storage.save(system.document_)
			}.bind(this))
		}.bind(this))
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
		}.bind(this), 3000)
	}
}
