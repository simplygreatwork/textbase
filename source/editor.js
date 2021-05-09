
import { an_inline_element, a_block_element } from './basics.js'
import { an_element_node, a_text_node } from './basics.js'
import { node_iterator, element_iterator, text_iterator } from './basics.js'
import { is_editable_node, is_alphanumeric } from './basics.js'
import { find_previous_inline_sibling, find_next_block } from './basics.js'
import { consume_event, decode_entities } from './basics.js'
import { get_selection, set_selection, set_caret, normalize_selection } from './selection.js'
import { allow } from './allowance.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Editor {
	
	constructor(bus, element) {
		
		this.bus = bus
		this.element = element
		this.initialize_content(bus, this)
		this.initialize_keymap(bus, this)
		this.initialize_actions(bus, this)
		this.initialize_allowances(bus, this)
		this.initialize_selection(bus, this)
	}
	
	initialize_content(bus, editor) {
		
		this.content = this.element.querySelector('.content')
	}
	
	initialize_keymap(bus, editor) {
		
		u(this.content).on('keydown', function(event) {
			this.process_key_event('keydown', event)
		}.bind(this))
		
		u(this.content).on('keyup', function(event) {
			this.process_key_event('keyup', event)
		}.bind(this))
		
		u(this.content).on('mousedown', function(event) {
			this.emit('editor:mousedown', event)
		}.bind(this))
	}
	
	process_key_event(type, event) {
		
		this.emit(type, event)
		if (is_alphanumeric(event.keyCode) && event.ctrlKey === false && event.metaKey === false) {
			this.emit(`${type}:alphanumeric`, event)
		} else {
			let key = event.key
			if (key == ' ') key = 'space'
			let array = []
			array.push(`${type}:`)
			if (event.ctrlKey) array.push('control-')
			if (event.metaKey) array.push('meta-')
			if (event.shiftKey) array.push('shift-')
			array.push(key.toLowerCase())
			this.emit(array.join(''), event)
		}
	}
	
	initialize_actions(bus, editor) {
		
		bus.on('action:insert-character', function(event, interrupt) {
			consume_event(event)
			interrupt()
			if (! this.can_insert_character(event)) return
			if (! allow('insert-character', bus, editor, event)) return
			this.insert_character(event)
		}.bind(this))
		
		bus.on('action:split-content', function(event, interrupt) {
			consume_event(event)
			interrupt()
			if (! this.can_split_content(event)) return
			if (! allow('split-content', bus, editor, event)) return
			this.split_content(a_block_element, event)
		}.bind(this))
		
		bus.on('action:delete', function(event, interrupt) {
			let selection = get_selection(this)
			if (this.can_delete_character(selection)) {
				this.delete_character(selection)
				consume_event(event)
				interrupt()
			}
		}.bind(this))
		
		bus.on('action:delete', function(event, interrupt) {
			let selection = get_selection(this)
			if (this.can_delete_block(selection)) {
				this.delete_block(selection)
				consume_event(event)
				interrupt()
			}
		}.bind(this))
		
		bus.on('action:delete', function(event, interrupt) {
			let selection = get_selection(this)
			if (this.can_delete_content(selection)) {
				this.delete_content(selection)
				consume_event(event)
				interrupt()
			}
		}.bind(this))
	}
	
	initialize_allowances(bus, editor) {
		
		bus.on('allow:insert-character', function(response, bus, editor, event) {
			response.allow = true
		})
		
		bus.on('allow:split-content', function(response, editor, event) {
			response.allow = true
		})
		
		bus.on('allow:delete-character', function(response, editor, event) {
			response.allow = true
		})
		
		bus.on('allow:delete-block', function(response, editor, event) {
			response.allow = true
		})
		
		bus.on('allow:delete-content', function(response, editor, event) {
			response.allow = true
		})
	}
	
	initialize_selection(bus) {
		
		document.addEventListener('selectionchange', function(event) {
			if (document.getSelection() && document.getSelection().anchorNode && document.getSelection().anchorNode.parentElement) {
				if (u(document.getSelection().anchorNode.parentElement).closest('.editor').first()) {
					bus.emit('selection-did-change', event, this)
				}
			}
		}.bind(this))
		
		bus.on('selection-did-change', function(event, editor) {
			normalize_selection(this)
		}.bind(this))
	}
	
	request_to_insert_character(event) {
		this.emit('action:insert-character', event)
	}
	
	can_insert_character(event) {
		return this.is_editable()
	}
	
	insert_character(event) {
		
		logger('trace').log('insert_character')
		consume_event(event)
		this.insert_text(event.key)
	}
	
	insert_string(string) {
		
		logger('trace').log('insert_string')
		string = decode_entities(string)
		this.insert_text(string)
	}
	
	insert_text(string) {
		
		logger('trace').log('insert_text')
		if (! this.is_editable()) return
		let selection = get_selection(this)
		if (! selection.range.collapsed) {
			this.delete_content(selection)
			selection = get_selection(this)
		}
		let node = u(selection.head.container)
		if (! node.is(a_text_node)) throw Error('Expected the selection container to be a text node.') 
		node = node.first()
		let text = node.nodeValue
		let head = text.substring(0, selection.head.offset)
		let tail = text.substring(selection.tail.offset)
		text = head + string + tail
		node.nodeValue = text
		set_caret(this, { container: node, offset: selection.head.offset + string.length })
		this.emit('content-did-change', node, node)
	}
	
	request_to_split_content(event) {
		this.emit('action:split-content', event)
	}
	
	can_split_content(event) {
		return this.is_editable()
	}
	
	split_content(limit) {
		
		logger('trace').log('split_content')
		if (! this.is_editable()) return
		this.emit('content-will-split')
		let selection = get_selection(this)
		if (! selection.range.collapsed) {
			this.request_to_delete(event)
			selection = get_selection(this)
		}
		let range = selection.range.cloneRange()
		let a = u(selection.head.container).closest(u(limit)).first()
		range.setEndAfter(a)
		let b = range.extractContents().firstElementChild.cloneNode(true)			// without clone, redo loses nodes
		u(a).after(b)
		set_caret(this, { container: b, offset: 0 })
		normalize_selection(this)
		this.emit('content-did-split', a, b)
		this.emit('content-did-change', a, b)
		return [a, b]
	}
	
	request_to_delete(event) {
		
		this.bus.emit('action:delete', event)
	}
	
	can_delete_character(selection) {
		
		let result = false
		let editor = this
		if (selection.range.collapsed) {
			if ((u(selection.head.container).is(a_text_node)) && (selection.head.offset > 0)) {
				result = { node: selection.head.container, offset: selection.head.offset }
			} else {
				let previous = find_previous_inline_sibling(editor, selection)
				if (previous) result = { node: previous, offset: previous.textContent.length }
			}
			if (! editor.is_editable()) result = false
		}
		return result
	}
	
	delete_character(selection) {
		
		let position = this.can_delete_character(selection)
		let node = position.node
		let offset = position.offset
		let text = u(node).text()
		let head = text.substring(0, offset - 1)
		let tail = text.substring(offset)
		text = head + tail
		u(node).text(text)
		if (text.length === 0) { 
			let previous = find_previous_inline_sibling(this, selection)
			if (previous) set_caret(this, { container: previous, offset: previous.textContent.length })
			this.emit('content-did-change', previous, node)
		} else {
			set_caret(this, { container: node, offset: offset - 1 })
			this.emit('content-did-change', node, node)
		}
	}
	
	can_delete_block(selection) {
		
		let result = false
		let editor = this
		if (selection.range.collapsed) {
			if (selection.head.offset === 0) {
				let iterator = text_iterator(editor.element, selection.head.container)
				let previous = iterator.previousNode()
				if (u(previous).parent().is(an_inline_element)) {
					if (u(selection.head.container).parent().parent().first() == u(previous).parent().parent().first()) {
						result = false
					} else {
						result = { node: u(previous).parent().parent().first() }
					}
				}
			}
			if (! editor.is_editable()) result = false
		}
		return result
	}
	
	delete_block(selection) {
		
		logger('trace').log('delete_block')
		let node = selection.head.container
		let block = u(node).closest(u(a_block_element))
		let iterator = text_iterator(this.element, node)
		let previous
		while (previous = iterator.previousNode()) {
			if (previous == this.element) break 
			let text = u(previous).text()
			if (text.trim().length > 0) {
				let block_ = u(previous).closest(u(a_block_element))
				let length = block_.children().nodes.length
				let selectable = block_.children().nodes[length - 1].firstChild
				block.children().each(function(each) {
					block_.append(each)
				})
				block.remove()
				set_caret(this, { container: selectable, offset: selectable.textContent.length })
				block_ = block_.first()
				this.emit('content-did-change', block_, block_)
				break
			}
		}
	}
	
	can_delete_content(selection) {
		
		let result = false
		let editor = this
		if (! selection.range.collapsed) result = true
		if (! editor.is_editable()) result = false
		return result
	}
	
	delete_content(selection) {
		
		logger('trace').log('delete_content')
		let fragment = selection.range.cloneContents()
		let div = document.createElement('div')
		div.appendChild(fragment.cloneNode(true))
		this.emit('content-will-delete', fragment)
		let offset = selection.head.offset
		let contents = selection.range.deleteContents()
		if (u(div).find(a_block_element).length) {
			set_caret(this, { container: selection.tail.container, offset: 0 })
			selection = get_selection(this)
			this.delete_block(selection)
		} else {
			set_caret(this, { container: selection.head.container, offset: offset })
		}
		this.emit('content-did-change', selection.head.container, selection.tail.container)
		this.emit('content-did-delete', fragment)
	}
	
	is_editable() {
		
		let selection = get_selection(this)
		if (! selection) return false 
		if (! is_editable_node(selection.head.container)) return false 
		if (! is_editable_node(selection.tail.container)) return false 
		return true
	}
	
	on() {
		return this.bus.on(...arguments)
	}
	
	emit() {
		return this.bus.emit(...arguments)
	}
}
