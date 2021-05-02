
import { zero_width_whitespace } from './basics.js'
import { find_next_editable_text_node } from './basics.js'
import { find_previous_editable_text_node } from './basics.js'
import { consume_event } from './basics.js'
import { get_selection, set_selection, set_caret } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function skip_right_over_zero_width_whitespace(event, editor) {
	
	let selection = get_selection(editor)
	let text = selection.tail.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.tail.offset == 1)) {
		consume_event(event)
		let next = find_next_editable_text_node(editor, selection.tail.container)
		if (next) set_caret(editor, { container: next, offset: 0 })
	}
}

export function skip_left_over_zero_width_whitespace(event, editor) {
	
	let selection = get_selection(editor)
	let text = selection.head.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.head.offset == 0)) {
		consume_event(event)
		let previous = find_previous_editable_text_node(editor, selection.head.container)
		if (previous) set_caret(editor, { container: previous, offset: previous.nodeValue.length })
	}
}

export function extend_selection_right(event, editor) {
	
	let selection = get_selection(editor)
	selection.tail.offset++
	if (selection.tail.offset > selection.tail.container.nodeValue.length) {
		let next = find_next_editable_text_node(editor, selection.tail.container)
		selection.tail.container = next
		selection.tail.offset = 0
	}
	set_selection(editor, selection)
	consume_event(event)
}

export function extend_selection_left(event, editor) {
	
	let selection = get_selection(editor)
	selection.tail.offset--
	if (selection.tail.offset < 0) {
		let previous = find_previous_editable_text_node(editor, selection.tail.container)
		selection.tail.container = previous
		selection.tail.offset = previous.nodeValue.length
	}
	set_selection(editor, selection)
	consume_event(event)
}

export function extend_selection_down(event, editor) {
	
	let selection = get_selection(editor)
	let block = find_next_editable_block(editor)
}

export function extend_selection_up(event, editor) {
	
	let selection = get_selection(editor)
	let block = find_previous_editable_block(editor)
}

function find_next_editable_block() {
	return
}

function find_previous_editable_block() {
	return
}
