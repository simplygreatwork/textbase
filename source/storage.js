
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
	
	load_mutable(options, bus) {
		
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
			if (! data || ! data.content) {
				data = { content: `<p><span>Begin editing here...</span></p>` }
			}
			let document_ = options
			document_.content = data.content
			this.bus.emit('document:did-load', document_)
		}.bind(this))
	}
	
	load_immutable(options, bus) {
		
		fetch(options.path)
		.then(function(response) {
			return response.text()
		}.bind(this))
		.then(function(content) {
			let document_ = options
			document_.content = content
			this.bus.emit('document:did-load', document_)
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
			this.bus.emit('document:did-save', response.status)
		}.bind(this))
	}	
}
