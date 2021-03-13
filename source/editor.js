
import { an_element_node, a_text_node } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
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
		this.initialize_events(this.bus)
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
	
	initialize_events(bus) {
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_character(selection)) {
				this.delete_character(selection)
				this.emit('content:did-change')
				event.consumed = true
			}
			return
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_block(selection)) {
				this.delete_block(selection)
				this.emit('content:did-change')
				event.consumed = true
			}
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (this.can_delete_content(selection)) {
				this.delete_content(selection)
				this.emit('content:did-change')
				event.consumed = true
			}
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (selection.range.collapsed) {
				if (can_delete_card(this, selection)) {
					delete_card(this, selection)
					this.emit('content:did-change')
					event.consumed = true
				}
			}
		}.bind(this))
		
		bus.on('delete-requested', function(event) {
			if (event.consumed) return
			let selection = get_selection(this)
			if (selection.range.collapsed) {
				if (can_delete_atom(this, selection)) {
					delete_atom(this, selection)
					this.emit('content:did-change')
					event.consumed = true
				}
			}
		}.bind(this))
		
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
		
		this.on('atom-will-enter', function(atom) {
			let type = u(card).data('atom-type')
			this.emit('atom-will-enter:' + type, atom)
		}.bind(this))
		
		this.on('atom-did-enter', function(atom) {
			let type = u(atom).data('atom-type')
			this.emit('atom-did-enter:' + type, atom)
		}.bind(this))
		
		this.on('atom-will-exit', function(atom) {
			let type = u(atom).data('atom-type')
			this.emit('atom-will-exit:' + type, atom)
		}.bind(this))
		
		this.on('atom-did-exit', function(atom) {
			let type = u(atom).data('atom-type')
			this.emit('atom-did-exit:' + type, atom)
		}.bind(this))
		
		this.on('card-will-enter', function(card) {
			let type = u(card).data('card-type')
			this.emit('card-will-enter:' + type, card)
		}.bind(this))
		
		this.on('card-did-enter', function(card) {
			let type = u(card).data('card-type')
			this.emit('card-did-enter:' + type, card)
		}.bind(this))
		
		this.on('card-will-exit', function(card) {
			let type = u(card).data('card-type')
			this.emit('card-will-exit:' + type, card)
		}.bind(this))
		
		this.on('card-did-exit', function(card) {
			let type = u(card).data('card-type')
			this.emit('card-did-exit:' + type, card)
		}.bind(this))
	}
	
	get_previous_block(node, offset) {
		
		let iterator = text_iterator(this.element, node)
		let previous = iterator.previousNode()
		if (u(node).parent().parent().first() != u(previous).parent().parent().first()) {
			return previous
		}
	}
	
	can_delete_character(selection) {
		
		let result = false
		if (selection.range.collapsed) {
			if ((u(selection.head.container).is(a_text_node)) && (selection.head.offset > 0)) {
				result = { node: selection.head.container, offset: selection.head.offset }
			} else {
				let iterator = text_iterator(this.element, selection.head.container)
				let previous = iterator.previousNode()
				if (u(previous).parent().is(an_inline_element)) {
					if (u(selection.head.container).parent().parent().first() == u(previous).parent().parent().first()) {
						result = { node: previous, offset: previous.textContent.length }
					}
				}
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
		u(node).text(head + tail)
		set_caret(this, { container: node, offset: offset - 1})
	}
	
	can_delete_block(selection) {
		
		let result = false
		if (selection.range.collapsed) {
			if (selection.head.offset > 0) {
				result = false
			} else {
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
				set_caret(this, { container: selectable, offset: selectable.textContent.length })
				break
			}
		}
	}
	
	can_delete_content(selection) {
		return ! selection.range.collapsed
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
			set_caret(this, { container: selection.tail.container, offset: 0 })
			selection = get_selection(this)
			this.delete_block(selection)
		} else {
			set_caret(this, { container: selection.head.container, offset: offset })
		}
		this.emit('content:did-delete', fragment)
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
		this.insert_string(key)
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
		selection.range.setStart(selection.head.container, selection.head.offset + string.length)
		selection.range.setEnd(selection.tail.container, selection.tail.offset + string.length)
		this.emit('content:did-change')
	}
	
	split_content(limit) {
		
		logger('trace').log('split_content')
		if (! this.is_editable()) return
		let selection = get_selection(this)
		if (! selection.range.collapsed) this.delete_()
		let range = selection.range.cloneRange()
		let node = u(selection.head.container).closest(u(limit)).first()
		range.setStartBefore(node)
		let fragment_a = range.extractContents()
		range.setEndAfter(node)
		let fragment_b = range.extractContents()
		let a = fragment_a.firstElementChild
		let b = fragment_b.firstElementChild
		range.insertNode(b)
		range.insertNode(a)
		set_caret(this, { container: b, offset: 0 })
		normalize_selection(this)
		this.emit('content:did-change')
		return [a, b]
	}
	
	is_editable() {
		
		let selection = get_selection(this)
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
