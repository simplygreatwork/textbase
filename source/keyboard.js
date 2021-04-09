
import { text_iterator } from './basics.js'
import { zero_width_whitespace } from './basics.js'
import { get_selection, set_selection, set_caret } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function skip_right_over_zero_width_whitespace(event, editor) {
	
	logger('trace').log('skip_right_over_zero_width_whitespace')
	let selection = get_selection(editor)
	let text = selection.tail.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.tail.offset == 1)) {
		event.preventDefault()
		let next = find_next_selectable_text_node(editor, selection)
		set_caret(editor, { container: next, offset: 0 })
	}
}

function find_next_selectable_text_node(editor, selection) {
	
	let iterator = text_iterator(editor.element, selection.tail.container)
	let node = iterator.nextNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) {
			return node
		}
		node = iterator.nextNode()
	}
	return node
}

export function skip_left_over_zero_width_whitespace(event, editor) {
	
	logger('trace').log('skip_left_over_zero_width_whitespace')
	let selection = get_selection(editor)
	let text = selection.head.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.head.offset == 0)) {
		event.preventDefault()
		let previous = find_previous_selectable_text_node(editor, selection)
		set_caret(editor, { container: previous, offset: previous.nodeValue.length })
	}
}

function find_previous_selectable_text_node(editor, selection) {
	
	let iterator = text_iterator(editor.element, selection.head.container)
	let node = iterator.previousNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) {
			return node
		}
		node = iterator.previousNode()
	}
	return node
}
