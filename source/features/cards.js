
import { an_inline_element, a_block_element, find_previous_block, find_previous_element } from '../basics.js'
import { a_text_node, an_element_node, element_iterator, text_iterator } from '../basics.js'
import { get_selection } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function configure_cards(bus, editor) {
	
	bus.on('document-did-install', function(document_) {
		activate_cards(bus, editor)
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		deactivate_cards(bus, editor)
	})
	
	bus.unshift('delete-requested', function(event) {
		if (event.consumed) return
		let selection = get_selection(editor)
		if (selection.range.collapsed) {
			if (can_delete_card(editor, selection)) {
				delete_card(editor, selection)
				event.consumed = true
			}
		}
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
	
	bus.on('card-will-enter', function(card) {
		let type = u(card).data('card-type')
		bus.emit('card-will-enter:' + type, card)
	})
	
	bus.on('card-did-enter', function(card) {
		let type = u(card).data('card-type')
		bus.emit('card-did-enter:' + type, card)
	})
	
	bus.on('card-will-exit', function(card) {
		let type = u(card).data('card-type')
		bus.emit('card-will-exit:' + type, card)
	})
	
	bus.on('card-did-exit', function(card) {
		let type = u(card).data('card-type')
		bus.emit('card-did-exit:' + type, card)
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
}

export function is_card(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-card-type]'))) return true
	if (node.closest(u('[data-card-type]')).first()) return true
	return false
}

export function activate_cards(bus, editor) {
	
	u(editor.element).find('[data-card-type]').each(function(card) {
		bus.emit('card-will-enter', card)
		bus.emit('card-did-enter', card)
	})
}

export function deactivate_cards(bus, editor) {
	
	u(editor.element).find('[data-card-type]').each(function(card) {
		bus.emit('card-will-exit', card)
		bus.emit('card-did-exit', card)
	})
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

export function delete_card(editor, selection) {
	
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
	
	logger('trace').log('watch_cards_will_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('[data-card-type]')) || (u(node).find('[data-card-type]')))) {
			bus.emit('card-will-enter', node)
		}
	})
}

export function watch_cards_will_exit(nodes, bus) {
	
	logger('trace').log('watch_cards_will_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('[data-card-type]')) || (u(node).find('[data-card-type]')))) {
			bus.emit('card-will-exit', node)
		}
	})
}

export function watch_cards_did_enter(nodes, bus) {
	
	logger('trace').log('watch_cards_did_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('[data-card-type]')) || (u(node).find('[data-card-type]')))) {
			bus.emit('card-did-enter', node)
		}
	})
}

export function watch_cards_did_exit(nodes, bus) {
	
	logger('trace').log('watch_cards_did_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('[data-card-type]')) || (u(node).find('[data-card-type]')))) {
			bus.emit('card-did-exit', node)
		}
	})
}
