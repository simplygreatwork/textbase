
import { an_element_node, a_text_node } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
import { find_previous_inline_sibling } from './basics.js'
import { find_next_block } from './basics.js'
import { node_iterator, element_iterator, text_iterator, is_alphanumeric } from './basics.js'
import { is_editable_node } from './basics.js'
import { get_selection, set_selection, set_caret, normalize_selection, selection_to_string } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Editor {
	
	constructor(bus, element) {
		
		this.bus = bus
		this.element = element
		this.initialize_content()
		this.initialize_keymap()
		this.initialize_events(bus)
		this.initialize_selection()
	}
	
	initialize_content() {
		
		this.content = this.element.querySelector('.content')
	}
	
	initialize_keymap() {
		
		u(this.content).on('keydown', function(event) {
			this.emit('keydown', event)
			if (is_alphanumeric(event.keyCode) && event.ctrlKey === false) {
				this.emit('keydown:alphanumeric', event)
			} else {
				let key = event.key
				if (key == ' ') key = 'space'
				let array = []
				array.push('keydown:')
				if (event.ctrlKey) array.push('control-')
				if (event.shiftKey) array.push('shift-')
				array.push(key.toLowerCase())
				this.emit(array.join(''), event)
			}
		}.bind(this))
		
		u(this.content).on('keyup', function(event) {
			this.emit('keyup', event)
			if (is_alphanumeric(event.keyCode) && event.ctrlKey === false) {
				this.emit('keyup:alphanumeric', event)
			} else {
				let key = event.key
				if (key == ' ') key = 'space'
				let array = []
				array.push('keyup:')
				if (event.ctrlKey) array.push('control-')
				if (event.shiftKey) array.push('shift-')
				array.push(key.toLowerCase())
				this.emit(array.join(''), event)
			}
		}.bind(this))
		
		u(this.content).on('mousedown', function(event) {
			this.emit('editor:mousedown', event)
		}.bind(this))
	}
	
	initialize_events(bus) {
		
		bus.on('split-content-requested', function(limit, event) {
			if (event && event.consumed) return
			this.split_content(limit, event)
			if (event) event.consumed = true
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_character(selection)) {
				this.delete_character(selection)
				event.consumed = true
			}
			return
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_block(selection)) {
				this.delete_block(selection)
				event.consumed = true
			}
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_content(selection)) {
				this.delete_content(selection)
				event.consumed = true
			}
		}.bind(this))
	}
	
	initialize_selection() {
		
		document.addEventListener('selectionchange', function(event) {
			if (document.getSelection() && document.getSelection().anchorNode && document.getSelection().anchorNode.parentElement) {
				if (u(document.getSelection().anchorNode.parentElement).closest('.editor').first()) {
					this.emit('selection-did-change', event, this)
				}
			}
		}.bind(this))
		
		this.on('selection-did-change', function(event, editor) {
			normalize_selection(this)
		}.bind(this))
	}
	
	can_insert_character(event) {
		return this.is_editable()
	}
	
	insert_character(event) {
		
		logger('trace').log('insert_character')
		if (event) event.preventDefault()
		this.insert_string(event.key)
	}
	
	insert_string(string) {
		
		logger('trace').log('insert_string')
		if (! this.is_editable()) return
		let selection = get_selection(this)
		if (! selection.range.collapsed) {
			this.delete_content(selection)
			selection = get_selection(this)
		}
		let node = u(selection.head.container)
		if (! node.is(a_text_node)) throw Error('Expected the selection container to be a text node.') 
		let text = node.text()
		let head = text.substring(0, selection.head.offset)
		let tail = text.substring(selection.tail.offset)
		text = head + string + tail
		node.text(text.trim())
		set_caret(this, { container: selection.head.container, offset: selection.head.offset + string.length })
		this.emit('content-did-change', selection.head.container, selection.tail.container)
	}
	
	split_content_(limit, event) {
		this.emit('split-content-requested', limit, event)
	}
	
	split_content(limit, event) {
		
		logger('trace').log('split_content')
		if (! this.is_editable()) return
		if (event) event.preventDefault()
		this.emit('content-will-split')
		let selection = get_selection(this)
		if (! selection.range.collapsed) {
			this.delete_(event)
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
	
	delete_(event) {
		
		if (event) event.preventDefault()
		this.bus.emit('delete-requested', { consumed: false })
	}
	
	can_delete_character(selection) {
		
		let result = false
		if (selection.range.collapsed) {
			if ((u(selection.head.container).is(a_text_node)) && (selection.head.offset > 0)) {
				result = { node: selection.head.container, offset: selection.head.offset }
			} else {
				let previous = find_previous_inline_sibling(this, selection)
				if (previous) result = { node: previous, offset: previous.textContent.length }
			}
			if (! this.is_editable()) result = false
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
		if (selection.range.collapsed) {
			if (selection.head.offset === 0) {
				let iterator = text_iterator(this.element, selection.head.container)
				let previous = iterator.previousNode()
				if (u(previous).parent().is(an_inline_element)) {
					if (u(selection.head.container).parent().parent().first() == u(previous).parent().parent().first()) {
						result = false
					} else {
						result = { node: u(previous).parent().parent().first() }
					}
				}
			}
			if (! this.is_editable()) result = false
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
		if (! selection.range.collapsed) result = true
		if (! this.is_editable()) result = false
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
