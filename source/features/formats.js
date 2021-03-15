
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { selection_edge, selection_each_node, selection_each_text, selection_each_block } from '../selection.js'
import { serialize } from '../serialize.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_format(editor, format, data) {
	
	logger('trace').log('toggle_format')
	data = data || {}
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	let add_class = false
	selection_each_text(editor, selection, function(node, index) {
		if (! u(node).parent().hasClass(format)) {
			add_class = true
		}
	})
	selection_each_text(editor, selection, function(node, index) {
		let parent = u(node).parent()
		Object.keys(data).forEach(function(each) {
			parent.data(each, data[each])
		})
		if (add_class == false) {
			parent.removeClass(format)
		} else {
			parent.addClass(format)
		}
	})
	editor.emit('content:did-change')
}

export function remove_formats(editor, formats) {
	
	logger('trace').log('remove_formats')
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	selection_each_text(editor, selection, function(node) {
		formats.forEach(function(each) {
			u(node).parent().removeClass(each)
		})
	})
	editor.emit('content:did-change')
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
