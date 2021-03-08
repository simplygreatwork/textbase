
import { text_iterator } from './basics.js'
import { get_selection, set_selection } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function caret_right(event, editor) {					// skip across zero width whitespace
	
	logger('trace').log('caret_right')
	let selection = get_selection(editor.element)
	let text = selection.tail.container.nodeValue
	if ((text.charAt(0) == '\u200b') && (selection.tail.offset == 1)) {
		var iterator = text_iterator(editor.element, selection.tail.container)
		let next = iterator.nextNode()
		selection.head.container = next
		selection.head.offset = 0
		selection.tail.container = next
		selection.tail.offset = 0
		set_selection(editor.element, selection)
	}
}

export function caret_left(event, editor) {					// skip across zero width whitespace
	
	logger('trace').log('caret_left')
	let selection = get_selection(editor.element)
	let text = selection.head.container.nodeValue
	if ((text.charAt(0) == '\u200b') && (selection.head.offset == 0)) {
		var iterator = text_iterator(editor.element, selection.head.container)
		let previous = iterator.previousNode()
		selection.head.container = previous
		selection.head.offset = previous.nodeValue.length - 1
		selection.tail.container = previous
		selection.tail.offset = previous.nodeValue.length - 1
		set_selection(editor.element, selection)
	}
}

export function caret_down(event, editor) {
	
	logger('trace').log('caret_down')
}

export function caret_up(event, editor) {
	
	logger('trace').log('caret_up')
}
