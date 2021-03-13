
import { get_selection } from '../selection.js'
import { an_inline_element, find_previous_block, find_previous_element } from '../basics.js'
import { an_element_node, element_iterator, text_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function can_insert_card(editor) {
	return true
}

export function insert_card(editor, card) {
	
	let parts = editor.split_content('p,h1,h2,li')
	let node = u(card)
	node.attr('contenteditable', 'false')
	node.attr('id', node.attr('id') || Math.random())
	let type = node.attr('data-card-type')
	editor.emit(`card-will-enter`, node)
	let selection = get_selection(editor)
	u(parts[0]).after(node)
	editor.emit(`card-did-enter`, node)
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
	}
}

export function watch_cards(added, removed, bus) {
	
	logger('trace').log('watch_cards')
	added.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.card')) {
			bus.emit('card-did-enter', u(node))
		}
	})
	removed.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.card')) {
			bus.emit('card-did-exit', u(node))
		}
	})
}
