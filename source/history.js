
// derived from lohfu/snapback

const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver

export class History {
	
	constructor(bus, element) {
		
		if (! MutationObserver) throw Error('MutationObserver could not be found.')
		
		Object.assign(this, {
			config: {
				subtree: true,
				attributes: true,
				attributeOldValue: true,
				childList: true,
				characterData: true,
				characterDataOldValue: true
			},
			element,
			bus,
			mutations: [],
			records: [],
			index: -1
		})
		
		this.observer = new MutationObserver(function(mutations) {
			
			if (this.mutations.length === 0 && mutations.length > 0) {
				this.bus.emit('history:did-begin-mutations')
			}
			mutations.forEach(function(mutation) {
				if (! this.is_observable(mutation.target)) return
				switch (mutation.type) {
					case 'characterData':
						mutation.newValue = mutation.target.textContent
						const lastMutation = this.mutations[this.mutations.length - 1]
						if (lastMutation && lastMutation.type === 'characterData' && lastMutation.target === mutation.target && lastMutation.newValue === mutation.oldValue) {
							lastMutation.newValue = mutation.newValue
							return
						}
						break
					case 'attributes':
						mutation.newValue = mutation.target.getAttribute(mutation.attributeName)
						break
				}
				this.mutations.push(mutation)
			}.bind(this))
		}.bind(this))
	}
	
	is_observable(target) {
		
		if (target && ((u(target).is(u('.card'))) || u(target).closest(u('.card')) == false)) return false
		if (target && ((u(target).is(u('.atom'))) || u(target).closest(u('.atom')) == false)) return false
		return true
	}
	
	enable() {
		
		if (! this.enabled) {
			this.observer.observe(this.element, this.config)
			this.enabled = true
		}
	}
	
	disable() {
		
		if (this.enabled) {
			this.observer.disconnect()
			this.enabled = false
		}
	}
	
	capture() {
		
		if (this.mutations.length > 0) {
			if (this.index < this.records.length - 1) {
				this.records = this.records.slice(0, this.index + 1)
			}
			this.records.push({
				mutations: this.mutations,
				selection: {}
			})
			this.mutations = []
			this.index = this.records.length - 1
			this.bus.emit('history:did-capture', this.records[this.index])
		}
	}
	
	undo() {
		
		this.capture()
		if (this.enabled && this.index >= 0) {
			this.disable()
			this.will_undo(this.records[this.index])
			this.perform_undo(this.records[this.index])
			this.index--
			this.enable()
		}
	}
	
	redo() {
		
		if (this.enabled && this.index < this.records.length - 1) {
			this.disable()
			this.will_redo(this.records[this.index + 1])
			this.perform_redo(this.records[this.index + 1])
			this.index++
			this.enable()
		}
	}
	
	will_undo(record) {
		
		let added = []
		let removed = []
		record.mutations.slice(0).reverse().forEach(function(mutation) {
			if (mutation.type == 'childList') {
				Array.from(mutation.removedNodes).forEach(function(node) {
					added.push(node)
				})
				Array.from(mutation.addedNodes).forEach(function(node) {
					removed.push(node)
				})
			}
		})
		this.bus.emit('history:will-undo', added, removed)
	}
	
	will_redo(record) {
		
		let added = []
		let removed = []
		record.mutations.forEach(function(mutation) {
			if (mutation.type == 'childList') {
				Array.from(mutation.addedNodes).forEach(function(node) {
					added.push(node)
				})
				Array.from(mutation.removedNodes).forEach(function(node) {
					removed.push(node)
				})
			}
		})
		this.bus.emit('history:will-redo', added, removed)
	}
	
	perform_undo(record) {
		
		let added = []
		let removed = []
		record.mutations.slice(0).reverse().forEach(function(mutation) {
			switch (mutation.type) {
				case 'characterData':
					this.mutate_character_data(mutation, mutation.oldValue)
					break
				case 'attributes':
					this.mutate_attributes(mutation, mutation.oldValue)
					break
				case 'childList':
					this.mutate_child_list(mutation, mutation.removedNodes, mutation.addedNodes, added, removed)
					break
			}
		}.bind(this))
		this.bus.emit('history:did-undo', added, removed)
	}
	
	perform_redo(record) {
		
		let added = []
		let removed = []
		record.mutations.forEach(function(mutation) {
			switch (mutation.type) {
				case 'characterData':
					this.mutate_character_data(mutation, mutation.newValue)
					break
				case 'attributes':
					this.mutate_attributes(mutation, mutation.newValue)
					break
				case 'childList':
					this.mutate_child_list(mutation, mutation.addedNodes, mutation.removedNodes, added, removed)
					break
			}
		}.bind(this))
		this.bus.emit('history:did-redo', added, removed)
	}
	
	mutate_character_data(mutation, value) {
		
		mutation.target.textContent = value
	}
	
	mutate_attributes(mutation, value) {
		
		if (value || value === false || value === 0) {
			mutation.target.setAttribute(mutation.attributeName, value)
		} else {
			mutation.target.removeAttribute(mutation.attributeName)
		}
	}
	
	mutate_child_list(mutation, add_nodes, remove_nodes, added, removed) {
		
		if (mutation.nextSibling) {
			Array.from(add_nodes).forEach(function(node) {
				mutation.nextSibling.parentNode.insertBefore(node, mutation.nextSibling)
				added.push(node)
			})
		} else {
			Array.from(add_nodes).forEach(function(node) {
				mutation.target.appendChild(node)
				added.push(node)
			})
		}
		Array.from(remove_nodes).forEach(function(node) {
			removed.push(node)
			if (node.parentNode) node.parentNode.removeChild(node)
		})
	}
}
