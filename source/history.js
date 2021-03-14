
// derived from lohfu/snapback

export class History {
	
	constructor(element, bus) {
		
		const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver
		if (! MutationObserver) return
		Object.assign(this, {
			observe: {
				subtree: true,
				attributes: true,
				attributeOldValue: true,
				childList: true,
				characterData: true,
				characterDataOldValue: true
			},
			element,
			bus,
			records: [],
			mutations: [],
			index: -1,
		})
		
		this.observer = new MutationObserver(function(mutations) {
			
			if (this.mutations.length === 0 && mutations.length > 0) {
				this.bus.emit('history:did-begin-mutations')
			}
			mutations.forEach(function(mutation) {
				if (mutation.target && ((u(mutation.target).is(u('.card'))) || u(mutation.target).closest(u('.card')) == false)) return
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
	
	disable() {
		
		if (this.enabled) {
			this.observer.disconnect()
			this.enabled = false
		}
	}
	
	enable() {
		
		if (! this.enabled) {
			this.observer.observe(this.element, this.observe)
			this.enabled = true
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
	
	redo() {
		
		if (this.enabled && this.index < this.records.length - 1) {
			this.will_undo_redo(this.records[this.index + 1], false)
			this.undo_redo(this.records[this.index + 1], false)
			this.index++
		}
	}
	
	undo() {
		
		this.capture()
		if (this.enabled && this.index >= 0) {
			this.will_undo_redo(this.records[this.index], true)
			this.undo_redo(this.records[this.index], true)
			this.index--
		}
	}
	
	will_undo_redo(record, isUndo) {
		
		this.disable()
		let added = []
		let removed = []
		const mutations = isUndo ? record.mutations.slice(0).reverse() : record.mutations
		mutations.forEach((mutation) => {
			switch (mutation.type) {
				case 'childList':
					const addNodes = isUndo ? mutation.removedNodes : mutation.addedNodes
					const removeNodes = isUndo ? mutation.addedNodes : mutation.removedNodes
					if (mutation.nextSibling) {
						Array.from(addNodes).forEach(function(node) {
							added.push(node)
						})
					} else {
						Array.from(addNodes).forEach(function(node) {
							added.push(node)
						})
					}
					Array.from(removeNodes).forEach(function(node) {
						removed.push(node)
					})
					break
			}
		})
		if (isUndo) {
			this.bus.emit('history:will-undo', added, removed)
		} else {
			this.bus.emit('history:will-redo', added, removed)
		}
		this.enable()
	}
	
	undo_redo(record, isUndo) {
		
		this.disable()
		let added = []
		let removed = []
		const mutations = isUndo ? record.mutations.slice(0).reverse() : record.mutations
		mutations.forEach((mutation) => {
			switch (mutation.type) {
				case 'characterData':
					mutation.target.textContent = isUndo ? mutation.oldValue : mutation.newValue
					break
				case 'attributes':
					const value = isUndo ? mutation.oldValue : mutation.newValue
					if (value || value === false || value === 0) {
						mutation.target.setAttribute(mutation.attributeName, value)
					} else {
						mutation.target.removeAttribute(mutation.attributeName)
					}
					break
				case 'childList':
					const addNodes = isUndo ? mutation.removedNodes : mutation.addedNodes
					const removeNodes = isUndo ? mutation.addedNodes : mutation.removedNodes
					if (mutation.nextSibling) {
						Array.from(addNodes).forEach(function(node) {
							mutation.nextSibling.parentNode.insertBefore(node, mutation.nextSibling)
							added.push(node)
						})
					} else {
						Array.from(addNodes).forEach(function(node) {
							mutation.target.appendChild(node)
							added.push(node)
						})
					}
					Array.from(removeNodes).forEach(function(node) {
						removed.push(node)
						if (node.parentNode) node.parentNode.removeChild(node)
					})
					break
			}
		})
		if (isUndo) {
			this.bus.emit('history:did-undo', added, removed)
		} else {
			this.bus.emit('history:did-redo', added, removed)
		}
		this.enable()
	}
}
