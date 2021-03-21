
export class Storage {
	
	constructor(bus) {
		
		this.configure_load(bus)
		this.configure_save(bus)
	}
	
	configure_load(bus) {
		
		bus.on('document:did-request-load', function(options) {
			
			if (! options.mutable) {
				this.options = options
				fetch(options.path)
				.then(function(response) {
					return response.text()
				}.bind(this))
				.then(function(content) {
					bus.emit('document:did-load', this.document_ = {
						mutable: options.mutable,
						path: options.path,
						content: options.content
					})
				}.bind(this))
			}
		}.bind(this))
		
		bus.on('document:did-request-load', function(options) {
			
			if (options.mutable) {
				this.options = options
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
					bus.emit('document:did-load', this.document_ = {
						mutable: options.mutable,
						path: options.path,
						token: options.token,
						content: data.content
					})
				}.bind(this))
			}
		}.bind(this))
	}
	
	configure_save(bus) {
		
		bus.on('document:did-request-save', function(document_) {
			
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
				bus.emit('document:did-save', response.status)
			})
		}.bind(this))
	}
}
