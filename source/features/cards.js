
import { an_inline_element, a_block_element, find_previous_block, find_previous_element } from '../basics.js'
import { an_element_node, element_iterator, text_iterator } from '../basics.js'
import { get_selection } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function activate_cards(editor, bus) {
	
	u(editor.element).find('.card').each(function(card) {
		bus.emit('card-will-enter', card)
		bus.emit('card-did-enter', card)
	})
}

export function deactivate_cards(editor, bus) {
	
	u(editor.element).find('.card').each(function(card) {
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
	if (element && u(element).is(an_inline_element)) return false
	let block = find_previous_block(editor.element, selection.head.container)
	if (! block) return false
	let card = u(block).closest('.card').first()
	if (! card) return false
	if (card) return card
	return false
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
		if (u(node).is(an_element_node) && ((u(node).is('.card')) || (u(node).find('.card')))) {
			bus.emit('card-will-enter', node)
		}
	})
}

export function watch_cards_will_exit(nodes, bus) {
	
	logger('trace').log('watch_cards_will_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('.card')) || (u(node).find('.card')))) {
			bus.emit('card-will-exit', node)
		}
	})
}

export function watch_cards_did_enter(nodes, bus) {
	
	logger('trace').log('watch_cards_did_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('.card')) || (u(node).find('.card')))) {
			bus.emit('card-did-enter', node)
		}
	})
}

export function watch_cards_did_exit(nodes, bus) {
	
	logger('trace').log('watch_cards_did_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && ((u(node).is('.card')) || (u(node).find('.card')))) {
			bus.emit('card-did-exit', node)
		}
	})
}
