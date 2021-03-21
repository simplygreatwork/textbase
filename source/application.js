
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
		
		bus.on('document:did-load', function(content) {
			system.install_document(content)
		}.bind(this))
	}
	
	load_document(bus) {
		
		let options = this.find_options()
		bus.emit('document:did-request-load', options.mutable, options.path, options.token)
	}
	
	find_options() {
		
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
}
