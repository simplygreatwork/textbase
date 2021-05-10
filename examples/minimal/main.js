
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import { Logger } from '../../source/logger.js'

const logger = Logger()

export class Application {
	
	constructor() {
		
		let bus = new Bus()
		let system = new System(bus)
		let storage = new Storage(bus)
		this.listen(bus, system, storage)
		bus.on('ready', function() {
			storage.load(this.options())
		}.bind(this))
		system.initialize()
	}
	
	listen(bus, system, storage) {
		
		bus.on('storage-did-load', function(document_) {
			system.install_document(document_)
		}.bind(this))
		
		bus.on('storage-did-save', function(status) {
			logger('trace').log('storage-did-save: ' + status)
		}.bind(this))
		
		bus.on('content-did-change', function(begin, end) {
			this.debounce(function() {
				let content = u(system.editor.content).clone().first()
				bus.emit('document-will-serialize', content)
				system.document_.content = content.innerHTML
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
				path: './examples/minimal/content.html'
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

new Application()
