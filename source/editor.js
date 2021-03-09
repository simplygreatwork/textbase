
import { an_element_node, a_text_node } from './basics.js'
import { node_iterator, element_iterator, text_iterator, is_alphanumeric } from './basics.js'
import { get_selection, set_selection, set_caret, selection_to_string } from './selection.js'
import { selection_edge, selection_each_node, selection_each_text, selection_each_block } from './selection.js'
import { normalize_selection } from './selection.js'
import { can_insert_atom, insert_atom, can_delete_atom, delete_atom } from './features/atom.js'
import { can_insert_card, insert_card, can_delete_card, delete_card } from './features/card.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger()
let blocks = 'p,h1,h2,li'

export class Editor {
	
	constructor(options) {
		
		Object.assign(this, options)
		this.initialize_content()
		this.initialize_keymap()
		this.initialize_events()
		this.initialize_selection()
	}
	
	initialize_content() {
		
		this.content = this.element.querySelector('.content')
		u(this.content).on('input', function(event) {
			this.emit('content:did-change')
		}.bind(this))
		this.element.appendChild(this.content)
		this.emit('content:did-change')
	}
	
	initialize_keymap() {
		
		u(this.content).on('keydown', function(event) {
			if (false) logger('editor').log('event.key: ' + event.key) 
			if (is_alphanumeric(event.keyCode) && event.ctrlKey === false) {
				this.emit('keydown:alphanumeric', event)
			} else {
				let array = []
				array.push('keydown:')
				if (event.ctrlKey) array.push('control-')
				if (event.shiftKey) array.push('shift-')
				array.push(event.key.toLowerCase())
				this.emit('keydown', event)
				this.emit(array.join(''), event)
			}
		}.bind(this))
		
		u(this.content).on('keyup', function(event) {
			if (false) logger('editor').log('event.key: ' + event.key) 
			if (is_alphanumeric(event.keyCode) && event.ctrlKey === false) {
				this.emit('keyup:alphanumeric', event)
			} else {
				let array = []
				array.push('keyup:')
				if (event.ctrlKey) array.push('control-')
				if (event.shiftKey) array.push('shift-')
				array.push(event.key.toLowerCase())
				this.emit('keyup', event)
				this.emit(array.join(''), event)
			}
		}.bind(this))
		
		u(this.content).on('mousedown', function(event) {
			this.emit('editor:mousedown', event)
		}.bind(this))
	}
	
	initialize_events() {
		
		this.on('content:will-delete', function(fragment) {
			u(fragment).find('.card').each(function(each) {
				this.emit('card-will-exit', each)
			}.bind(this))
		}.bind(this))
		
		this.on('content:did-delete', function(fragment) {
			u(fragment).find('.card').each(function(each) {
				this.emit('card-did-exit', each)
			}.bind(this))
		}.bind(this))
		
		this.on('card-will-exit', function(each) {
			let type = u(each).data('card-type')
			this.emit('card-will-exit:' + type)
		}.bind(this))
		
		this.on('card-did-exit', function(each) {
			let type = u(each).data('card-type')
			this.emit('card-did-exit:' + type)
		}.bind(this))
	}
	
	initialize_selection() {
		
		document.addEventListener('selectionchange', function(event) {
			if (document.getSelection() && document.getSelection().anchorNode && document.getSelection().anchorNode.parentElement) {
				if (u(document.getSelection().anchorNode.parentElement).closest('.editor').first()) {
					this.emit('selection:did-change', event, this)
				}
			}
		}.bind(this))
		
		this.on('selection:did-change', function(event, editor) {
			normalize_selection(this)
		}.bind(this))
	}
	
	can_insert_character() {
		return this.is_editable()
	}
	
	insert_character(key) {
		
		logger('trace').log('insert_character')
		if (! this.is_editable()) return
		let selection = get_selection(this.element)
		if (! selection.range.collapsed) {
			this.delete_content(selection)
			selection = get_selection(this.element)
		}
		let node = u(selection.head.container)
		if (node.is(an_element_node)) {				// after normalize_selection, this might never occur
			if (! node.is(u('span'))) {
				if (node.children().length == 0) {
					let span = u('<span></span>')
					span.text(key)
					node.append(span)
					let text_node = node.children().first().childNodes[0]
					selection.range.setStart(text_node, 1)
					selection.range.setEnd(text_node, 1)
				}
			}
		} else if (node.is(a_text_node)) {
			let text = node.text()
			let head = text.substring(0, selection.head.offset)
			let tail = text.substring(selection.tail.offset)
			text = head + event.key + tail
			node.text(text.trim())
			selection.range.setStart(selection.head.container, selection.head.offset + 1)
			selection.range.setEnd(selection.tail.container, selection.tail.offset + 1)
		}
		this.emit('content:did-change')
	}
	
	split_content(limit) {
		
		logger('trace').log('split_content')
		if (! this.is_editable()) return
		let selection = get_selection(this.element)
		if (! selection.range.collapsed) this.delete_()
		let range = selection.range.cloneRange()
		let node = u(selection.head.container).closest(u(limit)).first()
		range.setStartBefore(node)
		let fragment_a = range.extractContents()
		range.setEndAfter(node)
		let fragment_b = range.extractContents()
		let last = fragment_b.children[0].childNodes[0].childNodes[0]		// fixme: breaks when removing a selection with formatted text
		let a = fragment_a.firstElementChild
		let b = fragment_b.firstElementChild
		range.insertNode(b)
		range.insertNode(a)
		set_caret(this.element, { container: last, offset: 0 })
		this.emit('content:did-change')
		return [a, b]
	}
	
	delete_() {
		
		logger('trace').log('delete')
		this.shift_caret()
		let selection = get_selection(this.element)
		if (selection.range.collapsed) {
			if (this.can_delete_character(selection)) {
				this.delete_character(selection)
			} else if (can_delete_card(this, selection)) {
				delete_card(this, selection)
			} else if (can_delete_atom(this, selection)) {
				delete_atom(this, selection)
			} else if (this.can_delete_block(selection)) {
				this.delete_block(selection)
			}
		} else if (this.can_delete_content(selection)) {
			this.delete_content(selection)
		}
		this.emit('content:did-change')
	}
	
	shift_caret() {
		
		try {
			let selection = get_selection(this.element)
			let position = this.previous_caret_position()
			if (selection.head.container.parentElement.parentElement == position.container.parentElement.parentElement) {
				set_caret(this.element, { container: position.container, offset: position.offset })
			}
		} catch (e) {
			console.error('Exception in shift_caret')
		}
	}
	
	previous_caret_position() {
		
		let head = get_selection(this.element).head
		if (head.offset > 0) {
			return {
				container: head.container.parentElement,
				offset: head.offset - 1
			}
		} else {
			var iterator = text_iterator(this.element, head.container)
			let previous = iterator.previousNode()
			if (u(previous).parent().is(u('span'))) {
				return {
					container: previous,
					offset: head.container.textContent.length
				}
			}
		}
		return null
	}
	
	can_delete_character(selection) {
		
		let result = true
		if (! this.is_editable()) result = false 
		if (selection.head.offset == 0) result = false
		return result
	}
	
	delete_character(selection) {						// what if last remaining character?
																// perhaps use Array.splice instead
		logger('trace').log('delete_character')
		let node = u(selection.head.container)
		let text = node.text()
		let head = text.substring(0, selection.head.offset - 1)
		let tail = text.substring(selection.tail.offset)
		u(selection.head.container).text(head + tail)
		selection.range.setStart(selection.head.container, selection.head.offset - 1)		// todo: use set_caret instead?
		selection.range.setEnd(selection.tail.container, selection.tail.offset - 1)
	}
	
	can_delete_block() {
		return true
	}
	
	delete_block(selection) {
		
		logger('trace').log('delete_block')
		let node = selection.head.container
		let block = u(node).closest(u(blocks))
		var iterator = text_iterator(this.element, node)
		let previous
		while (previous = iterator.previousNode()) {
			if (previous == this.element) break 
			let text = u(previous).text()
			if (text.trim().length > 0) {
				let block_ = u(previous).closest(u(blocks))
				let length = block_.children().nodes.length
				let selectable = block_.children().nodes[length - 1].firstChild
				block.children().each(function(each) {
					block_.append(each)
				})
				block.remove()
				set_caret(this.element, { container: selectable, offset: selectable.textContent.length })
				break
			}
		}
	}
	
	can_delete_content() {
		return true
	}
	
	delete_content(selection) {
		
		logger('trace').log('delete_content')
		var fragment = selection.range.cloneContents()
		var div = document.createElement('div')
		div.appendChild(fragment.cloneNode(true))
		this.emit('content:will-delete', fragment)
		let offset = selection.head.offset
		let contents = selection.range.deleteContents()
		if (u(div).find('p,li,h1,h2,h3').length) {
			set_caret(this.element, { container: selection.tail.container, offset: 0 })
			selection = get_selection(this.element)
			this.delete_block(selection)
		} else {
			set_caret(this.element, { container: selection.head.container, offset: offset })
		}
		this.emit('content:did-delete', fragment)
	}
	
	is_editable() {
		
		let selection = get_selection(this.element)
		return u(selection.head.container).parent().first().contentEditable == 'inherit'
	}
	
	on() {
		this.bus.on(...arguments)
	}
	
	emit() {
		this.bus.emit(...arguments)
	}
}

export default { Editor }
