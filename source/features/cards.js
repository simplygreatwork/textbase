
import { an_inline_element, a_block_element, find_previous_block, find_previous_element } from '../basics.js'
import { a_text_node, an_element_node, element_iterator, text_iterator } from '../basics.js'
import { get_selection } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_cards(bus, editor, history) {
	
	bus.on('document-did-install', function(document_) {
		each_card(editor.element, editor.element, null, function(card) {
			bus.emit('card-will-enter', card)
			bus.emit('card-did-enter', card)
		})
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		each_card(editor.element, editor.element, null, function(card) {
			bus.emit('card-will-exit', card)
			bus.emit('card-did-exit', card)
		})
	})
	
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
		each_card(node, node, node, function(card) {
			bus.emit('card-will-enter', card)
		})
	})
	
	bus.on('content-did-insert', function(node, bus) {
		each_card(node, node, node, function(card) {
			bus.emit('card-did-enter', card)
		})
	})
	
	bus.on('content-will-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(each) {
			bus.emit('card-will-exit', each)
		})
	})
	
	bus.on('content-did-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(each) {
			bus.emit('card-did-exit', each)
		})
	})
	
	bus.on('history-will-undo', function(added, removed) {
		watch_cards_will_enter(added, bus)
		watch_cards_will_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed) {
		watch_cards_did_enter(added, bus)
		watch_cards_did_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-will-redo', function(added, removed) {
		watch_cards_will_enter(added, bus)
		watch_cards_will_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed) {
		watch_cards_did_enter(added, bus)
		watch_cards_did_exit(removed, bus)
	}.bind(this))
	
	bus.on('card-did-enter', function(atom) {
		history.capture()
	})
	
	bus.on('card-did-exit', function(atom) {
		history.capture()
	})
	
	bus.on('card-will-enter', function(card) {
		bus.emit(`card-will-enter:${u(card).data('card-type')}`, card)
	})
	
	bus.on('card-did-enter', function(card) {
		bus.emit(`card-did-enter:${u(card).data('card-type')}`, card)
	})
	
	bus.on('card-will-exit', function(card) {
		bus.emit(`card-will-exit:${u(card).data('card-type')}`, card)
	})
	
	bus.on('card-did-exit', function(card) {
		bus.emit(`card-did-exit:${u(card).data('card-type')}`, card)
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
	return true
}

export function insert_card(editor, string) {
	
	logger('trace').log('insert_card')
	let parts = editor.split_content(a_block_element)
	let card = u(string)
	card.attr('contenteditable', 'false')
	editor.emit(`card-will-enter`, card.first())
	let selection = get_selection(editor)
	u(parts[0]).after(card)
	card = card.first()
	editor.emit(`card-did-enter`, card)
	editor.emit('content-did-change', card, card)
}

export function can_delete_card(editor, selection) {
	
	logger('trace').log('can_delete_card')
	if (selection.head.offset > 0) return false
	let element = find_previous_element(editor.element, selection.head.container)
	if (! element) return false
	if (u(element).is(an_inline_element)) return false
	let block = find_previous_block(editor.element, selection.head.container)
	if (! block) return false
	let card = u(block).closest('[data-card-type]').first()
	if (card) return card
	else return false
}

export function delete_card(editor, selection, history) {
	
	logger('trace').log('delete_card')
	let card = can_delete_card(editor, selection)
	if (card) {
		editor.emit(`card-will-exit`, card)
		u(card).remove()
		editor.emit(`card-did-exit`, card)
		editor.emit('content-did-change', selection.head.container, selection.tail.container)
	}
}

export function watch_cards_will_enter(nodes, bus) {		// todo: actually need to use find
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card) {
			bus.emit('card-will-enter', card)
		})
	})
}

export function watch_cards_did_enter(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card) {
			bus.emit('card-did-enter', card)
		})
	})
}

export function watch_cards_will_exit(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card) {
			bus.emit('card-will-exit', card)
		})
	})
}

export function watch_cards_did_exit(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card) {
			bus.emit('card-did-exit', card)
		})
	})
}

export function each_card(top, begin, end, fn) {
	
	let node = begin
	let iterator = element_iterator(top, begin)
	while (node) {
		let node_ = u(node)
		if (node_.is(an_element_node)) {
			if (node_.is('[data-card-type]')) {
				fn(node_.first())
			}
		}
		if (node == end) break
		node = iterator.nextNode()
	}
}
