
import { iterate_characters } from './basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function set_selection_by_positions(element, options) {
	
	if (options.element) {
		return
	} else {
		let range = new Range()
		iterate_characters(element, function(char, position, node, index) {
			if (position === options.head) {
				range.setStart(node, index)
			} else if (position === options.tail) {
				range.setEnd(node, index)
			}
		})
		let selection = document.getSelection()
		selection.removeAllRanges()
		selection.addRange(range)
	}
}

export function get_selection_by_positions(element) {
	
	let result = null
	let selection = document.getSelection()
	if (selection && selection.rangeCount > 0) {
		let range = selection.getRangeAt(0)
		result = {
			range: range,
			head: { container: range.startContainer, offset: range.startOffset },
			middle: [],
			tail: { container: range.endContainer, offset: range.endOffset },
		}
		iterate_characters(element, function(char, position, node, index) {
			if (node == range.startContainer && index == range.startOffset) {
				result.head.position = position
			}
			if (node == range.endContainer && index == range.endOffset) {
				result.tail.position = position
			}
			if (result.head.position !== undefined && result.tail.position === undefined) {
				if (node != range.startContainer && node != range.endContainer) {
					if (u(node).parent().is(an_inline_element)) {
						node = node.parentElement
					}
					if (result.middle.indexOf(node) === -1) {
						result.middle.push(node)
					}
				}
			}
		})
		let array = []
		array.push(result.head.container.parentElement.tagName)
		array.push(result.head.offset)
		array.push(result.tail.container.parentElement.tagName)
		array.push(result.tail.offset)
		array.push(result.head.container.nodeType == 3)
		result.string = array.join(':')
	}
	return result
}

export function apply_selection_by_positions(head, tail) {
	
	let element = document.querySelector('.content')
	set_selection_by_positions(element, { head: head, tail: tail })
	set_selection_by_positions(element, { element: element})
	let selection = get_selection(element)
	logger('extras').log('selection: ' + JSON.stringify(selection, null, 2))
}
