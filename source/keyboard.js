
import { zero_width_whitespace } from './basics.js'
import { find_next_editable_text_node } from './basics.js'
import { find_previous_editable_text_node } from './basics.js'
import { consume_event } from './basics.js'
import { get_selection, set_selection, set_caret } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function skip_right_over_zero_width_whitespace(event, editor) {
	
	logger('trace').log('skip_right_over_zero_width_whitespace')
	let selection = get_selection(editor)
	let text = selection.tail.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.tail.offset == 1)) {
		consume_event(event)
		let next = find_next_editable_text_node(editor, selection.tail.container)
		if (next) set_caret(editor, { container: next, offset: 0 })
	}
}

export function skip_left_over_zero_width_whitespace(event, editor) {
	
	logger('trace').log('skip_left_over_zero_width_whitespace')
	let selection = get_selection(editor)
	let text = selection.head.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.head.offset == 0)) {
		consume_event(event)
		let previous = find_previous_editable_text_node(editor, selection.head.container)
		if (previous) set_caret(editor, { container: previous, offset: previous.nodeValue.length })
	}
}
