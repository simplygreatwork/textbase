
import { an_inline_element, a_block_element } from './basics.js'
import { an_element_node, a_text_node } from './basics.js'
import { node_iterator, text_iterator } from './basics.js'
import { Logger } from './logger.js'

const logger = Logger()

export function set_selection(editor, options) {
	
	if (options.tail.container.nodeType == 1) {
		let iterator = text_iterator(editor.element, options.tail.container)
		options.tail.container = iterator.nextNode()
		options.tail.offset = 0
	}
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
	
	if (options.container.nodeType == 1) {
		let iterator = text_iterator(editor.element, options.container)
		options.container = iterator.nextNode()
	}
	let range = new Range()
	range.setStart(options.container, options.offset)
	range.setEnd(options.container, options.offset)
	let selection = document.getSelection()
	selection.removeAllRanges()
	selection.addRange(range)
}

export function select_all(editor, event) {
	
	event.preventDefault()
	select_range(editor, editor.content, editor.content)
}

export function select_range(editor, from, to) {
	
	let first_child = document.createTreeWalker(from, NodeFilter.SHOW_TEXT).firstChild()
	let last_child = document.createTreeWalker(to, NodeFilter.SHOW_TEXT).lastChild()
	set_selection(editor, {
		head: { container: first_child, offset: 0 },
		tail: { container: last_child, offset: last_child.nodeValue.length }
	})
	normalize_selection(editor)
}

export function selection_edge(editor, selection) {
	
	let range, node, fragment
	let edges = [null, null]
	range = selection.range.cloneRange()
	node = u(selection.tail.container).closest(u(an_inline_element)).first()
	range.setStart(selection.tail.container, selection.tail.offset)
	range.setEndAfter(node)
	fragment = range.extractContents()
	edges[0] = fragment.children[0]
	range.insertNode(fragment)
	node = u(selection.head.container).closest(u(an_inline_element)).first()
	range.setStartBefore(node)
	range.setEnd(selection.head.container, selection.head.offset)
	fragment = range.extractContents()
	edges[1] = fragment.children[0]
	range.insertNode(fragment)
	select_range(editor, edges[1].nextSibling, edges[0].previousSibling)
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
	let iterator = text_iterator(editor.element, node)
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
		let element = u(node).closest(a_block_element).first()
		if (array.indexOf(element) === -1) array.push(element)
	})
	array.forEach(function(each) {
		if (! should_skip(each)) {
			fn(each)
		}
	})
}

function should_skip(node) {					// fixme: rework: should_skip is not descriptive
	
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
		let iterator = text_iterator(editor.element, selection.tail.container)
		let next = iterator.nextNode()
		selection.range.setEnd(next, 0)
		editor.emit('selection:did-change', null, editor)
	}
}

export function selection_to_string(selection) {
	
	let array = []
	array.push(selection.head.container.nodeType == 1 ? selection.tail.container.tagName : selection.tail.container.textContent)
	array.push(selection.head.offset)
	array.push(selection.tail.container.nodeType == 1 ? selection.tail.container.tagName : selection.tail.container.textContent)
	array.push(selection.tail.offset)
	return array.join(':')
}
