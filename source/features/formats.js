
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { selection_edge, selection_each_node, selection_each_text, selection_each_block, normalize_selection } from '../selection.js'
import { serialize } from '../serialize.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_format(editor, format, event) {
	
	logger('trace').log('toggle_format')
	toggle_format_with_data(editor, format, null, event)
}

export function toggle_format_with_data(editor, format, data, event) {
	
	logger('trace').log('toggle_format_with_data')
	if (event) event.preventDefault()
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	if (data) apply_data(editor, selection, data)
	let apply = false
	selection_each_text(editor, selection, function(node, index) {
		if (! u(node).parent().hasClass(format)) apply = true
	})
	if (apply) apply_format(editor, selection, format)
	else remove_format(editor, selection, format)
}

function apply_data(editor, selection, data) {
	
	selection_each_text(editor, selection, function(node, index) {
		let parent = u(node).parent()
		Object.keys(data).forEach(function(each) {
			parent.data(each, data[each])
		})
	})
}

function apply_format(editor, selection, format) {
	
	selection_each_text(editor, selection, function(node, index) {
		u(node).parent().addClass(format)
	})
	editor.emit('format:did-add', format)
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

function remove_format(editor, selection, format) {
	
	selection_each_text(editor, selection, function(node, index) {
		u(node).parent().removeClass(format)
	})
	editor.emit('format:did-remove', format)
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function remove_formats(editor, formats) {
	
	logger('trace').log('remove_formats')
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	selection = get_selection(editor)
	selection_each_text(editor, selection, function(node) {
		formats.forEach(function(each) {
			u(node).parent().removeClass(each)
		})
	})
	formats.forEach(function(format) {
		editor.emit('format:did-remove', format)
	})
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function find_active_formats(editor) {
	
	logger('trace').log('find_active_formats')
	let result = new Set()
	let selection = get_selection(editor)
	selection_each_text(editor, selection, function(each) {
		result = new Set(...result, Array.from(each.parentNode.classList))
	})
	return Array.from(result)
}

export function find_applicable_formats(editor) {
	
	let selection = get_selection(editor)
	return []
}
