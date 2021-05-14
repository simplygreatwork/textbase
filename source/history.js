
// derived from lohfu/snapback

import { is_editable_node } from './basics.js'
import { consume_event } from './basics.js'
import { Logger } from './logger.js'

const logger = Logger()
const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver

export class History {
	
	constructor(element, bus) {
		
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
			
			logger('history').log('--- OBSERVED MUTATIONS ---')
			if (this.mutations.length === 0 && mutations.length > 0) {
				logger('history').log('Beginning mutations...')
				this.bus.emit('history-did-begin-mutations')
			}
			mutations.forEach(function(mutation) {
				if (! this.is_observable(mutation)) return
				switch (mutation.type) {
					case 'characterData':
						logger('history').log(`Observed mutation of character data "${mutation.target.textContent}" at mutation target's parent ${mutation.target.parentNode ? mutation.target.parentNode.outerHTML : null}`)
						mutation.newValue = mutation.target.textContent
						const lastMutation = this.mutations[this.mutations.length - 1]
						if (lastMutation && lastMutation.type === 'characterData' && lastMutation.target === mutation.target && lastMutation.newValue === mutation.oldValue) {
							lastMutation.newValue = mutation.newValue
							return
						}
						break
					case 'attributes':
						mutation.newValue = mutation.target.getAttribute(mutation.attributeName)
						logger('history').log(`Observed mutation of attribute "${mutation.attributeName}" set to "${mutation.newValue}" at mutation target's parent ${mutation.target.parentNode ? mutation.target.parentNode.outerHTML : null}`)
						break
					case 'childList':
						Array.from(mutation.addedNodes).forEach(function(node) {
							logger('history').log(`Observed mutation of child node "${node.outerHTML}" added to "${mutation.target ? mutation.target.outerHTML : null}"`)
						})
						Array.from(mutation.removedNodes).forEach(function(node) {
							logger('history').log(`Observed mutation of child node "${node.outerHTML}" removed from "${ mutation.target ? mutation.target.outerHTML : null}"`)
						})
						break
				}
				this.mutations.push(mutation)
			}.bind(this))
		}.bind(this))
	}
	
	is_observable(mutation) {
		return is_editable_node(mutation.target)
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
		
		if (! this.enabled) return
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
			this.bus.emit('history-did-capture', this.records[this.index])
		}
	}
	
	undo(event) {
		
		consume_event(event)
		this.capture()
		if (this.enabled && this.index >= 0) {
			this.disable()
			this.will_undo(this.records[this.index])
			this.perform_undo(this.records[this.index])
			this.index--
			this.enable()
		}
	}
	
	redo(event) {
		
		consume_event(event)
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
		let changed = []
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
		this.bus.emit('history-will-undo', added, removed, changed)
	}
	
	will_redo(record) {
		
		let added = []
		let removed = []
		let changed = []
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
		this.bus.emit('history-will-redo', added, removed, changed)
	}
	
	perform_undo(record) {
		
		logger('history').log('--- PERFORM UNDO ---')
		let added = []
		let removed = []
		let changed = []
		record.mutations.slice(0).reverse().forEach(function(mutation) {
			switch (mutation.type) {
				case 'characterData':
					this.mutate_character_data(mutation, mutation.oldValue, changed)
					break
				case 'attributes':
					this.mutate_attributes(mutation, mutation.oldValue)
					break
				case 'childList':
					this.mutate_child_list(mutation, mutation.removedNodes, mutation.addedNodes, added, removed)
					break
			}
		}.bind(this))
		this.bus.emit('history-did-undo', added, removed, changed)
	}
	
	perform_redo(record) {
		
		logger('history').log('--- PERFORM REDO ---')
		let added = []
		let removed = []
		let changed = []
		record.mutations.forEach(function(mutation) {
			switch (mutation.type) {
				case 'characterData':
					this.mutate_character_data(mutation, mutation.newValue, changed)
					break
				case 'attributes':
					this.mutate_attributes(mutation, mutation.newValue)
					break
				case 'childList':
					this.mutate_child_list(mutation, mutation.addedNodes, mutation.removedNodes, added, removed)
					break
			}
		}.bind(this))
		this.bus.emit('history-did-redo', added, removed, changed)
	}
	
	mutate_character_data(mutation, value, changed) {
		
		logger('history').log(`Setting character data to "${value}" at mutation target's parent "${mutation.target.parentNode ? mutation.target.parentNode.outerHTML : null}"`)
		mutation.target.textContent = value
		changed.push(mutation.target)
	}
	
	mutate_attributes(mutation, value) {
		
		if (value || value === false || value === 0) {
			logger('history').log(`Setting attribute "${mutation.attributeName}" to "${value}" for mutation target "${mutation.target ? mutation.target.outerHTML : null}`)
			mutation.target.setAttribute(mutation.attributeName, value)
		} else {
			logger('history').log(`Removing attribute "${mutation.attributeName}" for mutation target "${mutation.target ? mutation.target.outerHTML : null}`)
			mutation.target.removeAttribute(mutation.attributeName)
		}
	}
	
	mutate_child_list(mutation, add_nodes, remove_nodes, added, removed) {
		
		if (mutation.nextSibling) {
			Array.from(add_nodes).forEach(function(node) {
				mutation.nextSibling.parentNode.insertBefore(node, mutation.nextSibling)
				added.push(node)
				logger('history').log(`Inserted node before next sibling "${node.outerHTML}" at parent "${mutation.nextSibling.parentNode ? mutation.nextSibling.parentNode.outerHTML : null}"`)
			})
		} else {
			Array.from(add_nodes).forEach(function(node) {
				mutation.target.appendChild(node)
				added.push(node)
				logger('history').log(`Appended node "${node.outerHTML}" to parent "${mutation.target ? mutation.target.outerHTML : null}"`)
			})
		}
		Array.from(remove_nodes).forEach(function(node) {
			removed.push(node)
			let parent = node.parentNode
			parent.removeChild(node)
			logger('history').log(`Removed node "${node.outerHTML}" from parent "${parent ? parent.outerHTML : null}"`)
		})
	}
}
