
export class Storage {
	
	constructor(bus) {
		
		this.configure_loading(bus)
		this.configure_saving(bus)
	}
	
	configure_loading(bus) {
		
		bus.on('document:did-request-load', function(mutable, path) {
			
			if (! mutable) {
				this.mutable = mutable
				this.path = path
				fetch(path)
				.then(function(response) {
					return response.text()
				}.bind(this))
				.then(function(content) {
					bus.emit('document:did-load', content)
				}.bind(this))
			}
		}.bind(this))
		
		bus.on('document:did-request-load', function(mutable, path, token) {
			
			if (mutable) {
				this.mutable = mutable
				this.path = path
				this.token = token
				fetch(path, {
					headers: {
						authorization: token,
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
					bus.emit('document:did-load', data.content)
				})
			}
		}.bind(this))
	}
	
	configure_saving(bus) {
		
		bus.on('document:did-request-save', function(path, content, token) {
			
			if (! this.mutable) return
			if (! this.token) return
			fetch(path, {
				headers: {
					authorization: this.token,
				},
				method: 'post',
				body: JSON.stringify({ content : content })
			})
			.then(function(response) {
				bus.emit('document:did-save', response.status)
			})
		}.bind(this))
		
		bus.on('document:did-save', function(status) {
			console.log('document:did-save: ' + status)
		}.bind(this))
		
		bus.on('content:did-change', function(status) {
			
			if (this.timeout_id) {
				window.clearTimeout(this.timeout_id)
				this.timeout_id = null
			}
			this.timeout_id = window.setTimeout(function() {
				this.timeout_id = null
				let content = document.querySelector('.content').innerHTML
				bus.emit('document:did-request-save', this.path, content)
			}.bind(this), 5000)
		}.bind(this))
	}
}
