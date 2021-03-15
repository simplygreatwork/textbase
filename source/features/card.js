
import { get_selection } from '../selection.js'
import { an_inline_element, find_previous_block, find_previous_element } from '../basics.js'
import { an_element_node, element_iterator, text_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function can_insert_card(editor) {
	return true
}

export function insert_card(editor, string) {
	
	logger('trace').log('insert_card')
	let parts = editor.split_content('p,h1,h2,li')
	let card = u(string)
	card.attr('contenteditable', 'false')
	card.attr('id', card.attr('id') || Math.random())
	let type = card.attr('data-card-type')
	editor.emit(`card-will-enter`, card.first())
	let selection = get_selection(editor)
	u(parts[0]).after(card)
	editor.emit(`card-did-enter`, card.first())
}

export function can_delete_card(editor, selection) {
	
	logger('trace').log('can_delete_card')
	if (selection.head.offset > 0) return false
	let previous_element = find_previous_element(editor.element, selection.head.container)
	if (u(previous_element).is(an_inline_element)) return false
	let previous_block = find_previous_block(editor.element, selection.head.container)
	if (previous_block && u(previous_block).hasClass('card')) return true
	return false
}

export function delete_card(editor, selection) {
	
	logger('trace').log('delete_card')
	let node = selection.head.container
	let block = u(node).closest(u('p,h1,h2,li'))
	var iterator = element_iterator(editor.element, block.first())
	let previous = iterator.previousNode()
	if (u(previous).hasClass('card')) {
		let card = previous
		let type = u(card).attr('data-card-type')
		editor.emit(`card-will-exit`, card)
		u(previous).remove()
		editor.emit(`card-did-exit`, card)
		editor.emit('content:did-change')
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
