
import { an_element_node, a_text_node } from './basics.js'
import { node_iterator, text_iterator, iterate_characters } from './basics.js'
import { Logger } from './logger.js'

const logger = Logger()

export function set_selection(editor, options) {
	
	let selection = document.getSelection()
	selection.removeAllRanges()
	let range = new Range()
	range.setStart(options.head.container, options.head.offset)
	range.setEnd(options.tail.container, options.tail.offset)
	selection.addRange(range)
}

export function get_selection(editor) {
	
	let selection = document.getSelection()
	if (selection && selection.rangeCount > 0) {
		let range = selection.getRangeAt(0)
		if (! u(range.startContainer).closest(u('.content'))) return null
		if (! u(range.endContainer).closest(u('.content'))) return null
		return {
			range: range,
			head: { container: range.startContainer, offset: range.startOffset },
			tail: { container: range.endContainer, offset: range.endOffset }
		}
	}
	return null
}

export function set_caret(editor, options) {
	
	let range = new Range()
	range.setStart(options.container, options.offset)
	range.setEnd(options.container, options.offset)
	let selection = document.getSelection()
	selection.removeAllRanges()
	selection.addRange(range)
}

export function selection_edge(editor, selection) {
	
	let range, node, fragment
	let edges = [null, null]
	range = selection.range.cloneRange()
	node = u(selection.tail.container).closest(u('span')).first()
	range.setStart(selection.tail.container, selection.tail.offset)
	range.setEndAfter(node)
	fragment = range.extractContents()
	edges[0] = fragment.children[0]
	range.insertNode(fragment)
	node = u(selection.head.container).closest(u('span')).first()
	range.setStartBefore(node)
	range.setEnd(selection.head.container, selection.head.offset)
	fragment = range.extractContents()
	edges[1] = fragment.children[0]
	range.insertNode(fragment)
	return edges
}

export function selection_each_node(editor, selection, fn) {
	
	let node = selection.head.container
	let iterator = node_iterator(editor.element, node)
	let index = 0
	while (node) {
		fn(node, index)
		if (node == selection.tail.container) break
		node = iterator.nextNode()
		index++
	}
}

export function selection_each_text(editor, selection, fn) {
	
	let node = selection.head.container
	var iterator = text_iterator(editor.element, node)
	let index = 0
	while (node) {
		if (u(node).text().trim().length > 0) {
			if (! should_skip(node)) {
				fn(node, index)
			}
		}
		if (node == selection.tail.container) break
		node = iterator.nextNode()
		index++
	}
}

export function selection_each_block(editor, selection, fn) {
	
	let array = []
	selection_each_node(editor, selection, function(node) {
		if (u(node).is(a_text_node)) node = node.parentElement
		let element = u(node).closest('p,h1,h2,h3,ul,ol,li').first()
		if (array.indexOf(element) === -1) array.push(element)
	})
	array.forEach(function(each) {
		if (! should_skip(each)) {
			fn(each)
		}
	})
}

function should_skip(node) {
	
	if (u(node).parent().is('.atom')) return true
	if (u(node).parent().is('.card')) return true
	if (u(node).parent().closest('.atom').first()) return true
	if (u(node).parent().closest('.card').first()) return true
	return false
}

export function get_selection_length(editor, selection) {
	
	let result = 0
	selection_each_text(editor, selection, function(node, index) {
		if (node == selection.head.container) {
			result = selection.head.container.textContent.length - selection.head.offset
		} else if (node == selection.tail.container) {
			result = selection.tail.offset 
		} else {
			result = node.textContent.length 
		}
	})
	return result
}

export function normalize_selection(editor) {
	
	let selection = get_selection(editor)
	if (selection && selection.range && selection.tail.container.nodeType == 1) {
		var iterator = text_iterator(editor.element, selection.tail.container)
		let next = iterator.nextNode()
		selection.range.setEnd(next, 0)
		editor.emit('selection:did-change', null, editor)
	}
}

export function selection_to_string(selection) {
	
	let array = []
	if (selection.head.container.nodeType == 1) {
		array.push(selection.head.container.tagName)
	} else {
		array.push(selection.head.container.textContent)
	}
	array.push(selection.head.offset)
	if (selection.head.container.nodeType == 1) {
		array.push(selection.tail.container.tagName)
	} else {
		array.push(selection.tail.container.textContent)
	}
	array.push(selection.tail.offset)
	return array.join(':')
}

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
					if (u(node).parent().is('span')) {
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
