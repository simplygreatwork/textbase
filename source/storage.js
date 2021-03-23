
import { Logger } from './logger.js'

const logger = Logger()

export class Storage {
	
	constructor(bus) {
		this.bus = bus
	}
	
	load(options) {
		
		if (options.mutable) {
			this.load_mutable(options)
		} else {
			this.load_immutable(options)
		}
	}
	
	load_mutable(options) {
		
		fetch(options.path, {
			headers: {
				authorization: options.token,
			},
			method: 'get'
		})
		.then(function(response) {
			return response.json()
		})
		.then(function(data) {
			if (! data || ! data.content) data = { content: `<p><span>Begin editing here...</span></p>` }
			this.bus.emit('storage-did-load', Object.assign(options, data))
		}.bind(this))
	}
	
	load_immutable(options) {
		
		fetch(options.path)
		.then(function(response) {
			return response.text()
		}.bind(this))
		.then(function(content) {
			options.content = content
			this.bus.emit('storage-did-load', options)
		}.bind(this))
	}
	
	save(document_) {
		
		if (! document_.mutable) return
		if (! document_.token) return
		fetch(document_.path, {
			headers: {
				authorization: document_.token,
			},
			method: 'post',
			body: JSON.stringify({ content : document_.content })
		})
		.then(function(response) {
			this.bus.emit('storage-did-save', response.status)
		}.bind(this))
	}	
}
