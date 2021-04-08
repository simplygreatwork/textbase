
import { an_inline_element, a_block_element, find_previous_block, find_previous_element } from '../basics.js'
import { a_text_node, an_element_node, element_iterator, text_iterator } from '../basics.js'
import { get_selection } from '../selection.js'
import { is_atom } from './atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_cards(bus, editor, history) {
	
	bus.on('document-did-install', function(document_) {
		each_card(editor.element, editor.element, null, function(card, type) {
			bus.emit('card-will-enter', card, type)
			bus.emit('card-did-enter', card, type)
		})
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		each_card(editor.element, editor.element, null, function(card, type) {
			bus.emit('card-will-exit', card, type)
			bus.emit('card-did-exit', card, type)
		})
	})
	
	bus.unshift('split-content-requested', function(limit, event) {
		let selection = get_selection(this)
		if (is_card(selection.head.container) || is_card(selection.tail.container)) {
			if (event) {
				event.consumed = true
				event.preventDefault()
			}
		}
	}.bind(this))
	
	bus.unshift('delete-requested', function(event) {
		if (event.consumed) return
		let selection = get_selection(editor)
		if (selection.range.collapsed) {
			if (can_delete_card(editor, selection)) {
				delete_card(editor, selection, history)
				event.consumed = true
			}
		}
	})
	
	bus.on('content-will-insert', function(node, bus) {
		each_card(node, node, node, function(card, type) {
			bus.emit('card-will-enter', card, type)
		})
	})
	
	bus.on('content-did-insert', function(node, bus) {
		each_card(node, node, node, function(card, type) {
			bus.emit('card-did-enter', card, type)
		})
	})
	
	bus.on('content-will-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(container) {
			let card = u(container).children(':first-child').children(':first-child').first()
			let type = u(container).data('card-type')
			bus.emit('card-will-exit', card, type)
		})
	})
	
	bus.on('content-did-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(container) {
			let card = u(container).children(':first-child').children(':first-child').first()
			let type = u(container).data('card-type')
			bus.emit('card-will-exit', card, type)
		})
	})
	
	bus.on('history-will-undo', function(added, removed) {
		batch_emit('card-will-enter', added, bus)
		batch_emit('card-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed) {
		batch_emit('card-did-enter', added, bus)
		batch_emit('card-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-will-redo', function(added, removed) {
		batch_emit('card-will-enter', added, bus)
		batch_emit('card-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed) {
		batch_emit('card-did-enter', added, bus)
		batch_emit('card-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('card-did-enter', function(card) {
		history.capture()
	})
	
	bus.on('card-did-exit', function(card) {
		history.capture()
	})
	
	bus.on('card-will-enter', function(card, type) {
		bus.emit(`card-will-enter:${type}`, card)
	})
	
	bus.on('card-did-enter', function(card, type) {
		bus.emit(`card-did-enter:${type}`, card)
	})
	
	bus.on('card-will-exit', function(card, type) {
		bus.emit(`card-will-exit:${type}`, card)
	})
	
	bus.on('card-did-exit', function(card, type) {
		bus.emit(`card-did-exit:${type}`, card)
	})
}

export function is_card(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-card-type]'))) return true
	if (node.closest(u('[data-card-type]')).first()) return true
	return false
}

export function can_insert_card(editor) {
	
	let selection = get_selection(editor)
	if (is_atom(selection.head.container) && is_atom(selection.tail.container)) return false		// fixme: dependency
	if (is_card(selection.head.container) && is_card(selection.tail.container)) return false
	return true
}

export function insert_card(editor, type, string) {
	
	logger('trace').log('insert_card')
	if (! can_insert_card(editor)) return 
	let parts = editor.split_content(a_block_element)
	let card = u(string)
	let container = create_container(card, type)
	editor.emit(`card-will-enter`, card.first(), type)
	let selection = get_selection(editor)
	u(parts[0]).after(container)
	card = card.first()
	container = container.first()
	editor.emit(`card-did-enter`, card, type)
	editor.emit('content-did-change', container, container)
}

export function create_container(card, type) {
	
	let container = u(`
		<div>
			<div class="card-content"></div>
			<div class="card-caret"><span contenteditable="true"><span>&#x200B;</span></span></div>
		</div>
	`)
	container.data('card-type', type)
	container.attr('contenteditable', 'false')
	container.addClass('card-container')
	container.addClass('flex-container')
	container.children(':first-child').append(card)
	return container 
}

export function can_delete_card(editor, selection) {
	
	logger('trace').log('can_delete_card')
	if (selection.head.offset > 0) return false
	let element = find_previous_element(editor.element, selection.head.container)
	if (! element) return false
	if (u(element).is(an_inline_element)) return false
	let block = find_previous_block(editor.element, selection.head.container)
	if (! block) return false
	let container = u(block).closest('[data-card-type]').first()
	if (container) return container
	else return false
}

export function delete_card(editor, selection, history) {
	
	logger('trace').log('delete_card')
	let container = can_delete_card(editor, selection)
	if (container) {
		let card = u(container).children(':first-child').children(':first-child').first()
		let type = u(container).data('card-type')
		editor.emit(`card-will-exit`, card, type)
		u(container).remove()
		editor.emit(`card-did-exit`, card, type)
		editor.emit('content-did-change', selection.head.container, selection.tail.container)
	}
}

function batch_emit(key, nodes, bus) {
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card, type) {
			bus.emit(key, card, type)
		})
	})
}

function each_card(top, begin, end, fn) {
	
	let node = begin
	let iterator = element_iterator(top, begin)
	while (node) {
		let node_ = u(node)
		if (node_.is(an_element_node)) {
			if (node_.is('[data-card-type]')) {
				let card = u(node_).children(':first-child').children(':first-child').first()
				let type = u(node_).data('card-type')
				fn(card, type)
			}
		}
		if (node == end) break
		node = iterator.nextNode()
	}
}
