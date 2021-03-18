
import { text_iterator } from './basics.js'
import { text_iterator } from './basics.js'
import { get_selection, set_selection, set_caret } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function caret_right(event, editor) {					// skip across zero width whitespace
	
	logger('trace').log('caret_right')
	let selection = get_selection(editor)
	let text = selection.tail.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.tail.offset == 1)) {
		event.preventDefault()
		let iterator = text_iterator(editor.element, selection.tail.container)
		let next = iterator.nextNode()
		set_caret(editor, { container: next, offset: 0 })
	}
}

export function caret_left(event, editor) {					// skip across zero width whitespace
	
	logger('trace').log('caret_left')
	let selection = get_selection(editor)
	let text = selection.head.container.nodeValue
	if ((text.charAt(0) == zero_width_whitespace) && (selection.head.offset == 0)) {
		event.preventDefault()
		let iterator = text_iterator(editor.element, selection.head.container)
		let previous = iterator.previousNode()
		set_caret(editor, { container: previous, offset: previous.nodeValue.length })
	}
}

export function caret_down(event, editor) {
	
	logger('trace').log('caret_down')
}

export function caret_up(event, editor) {
	
	logger('trace').log('caret_up')
}
