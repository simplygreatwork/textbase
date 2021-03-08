
import { get_selection } from '../selection.js'
import { element_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function can_insert_card(editor) {
	return
}

export function insert_card(editor, card) {
	
	let parts = editor.split_content('p,h1,h2,li')
	let node = u(card)
	node.attr('contenteditable', 'false')
	node.attr('id', node.attr('id') || Math.random())
	let type = node.attr('data-card-type')
	editor.emit(`card-will-enter:${type}`, node)
	let selection = get_selection(editor.element)
	u(parts[0]).after(node)
	editor.emit(`card-did-enter:${type}`, node)
}

export function can_delete_card(editor, selection) {
	
	logger('trace').log('can_delete_card')
	let node = selection.head.container
	let block = u(node).closest(u('p,h1,h2,li'))
	var iterator = element_iterator(editor.element, block.first())
	let previous = iterator.previousNode()
	return u(previous).hasClass('card') ? true : false
}

export function delete_card(editor, selection) {
	
	logger('trace').log('delete_card')
	let node = selection.head.container
	let block = u(node).closest(u('p,h1,h2,li'))
	var iterator = element_iterator(editor.element, block.first())
	let previous = iterator.previousNode()
	if (u(previous).hasClass('card')) {
		u(previous).remove()
	}
}
