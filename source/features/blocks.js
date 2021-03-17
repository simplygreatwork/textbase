
import { a_text_node } from '../basics.js'
import { get_selection, set_selection, selection_each_block } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_block(editor, type) {
	
	logger('trace').log('toggle_block')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let element = u(`<${type}>`)
		if (u(node).data('indent')) {
			element.data('indent', u(node).data('indent'))
		}
		u(node).children().each(function(each) {
			u(each).remove()
			element.append(each)
		})
		u(node).replace(element)
	})
	set_selection(editor, selection)
	editor.emit('content:did-change', selection.head.container, selection.tail.container)
}

export function find_active_block(editor, blocks) {
	
	logger('trace').log('find_active_block')
	let selection = get_selection(editor)
	let node = u(selection.head.container)
	if (node.is(a_text_node)) node = node.parent()
	let ancestor = node.closest(blocks).first()
	return ancestor.tagName.toLowerCase()
}

export function find_applicable_blocks(editor, blocks) {
	
	logger('trace').log('find_applicable_blocks')
	let block = find_active_block(editor, blocks)
	blocks = blocks.split(',')
	blocks.splice(blocks.indexOf(block), 1)
	return blocks
}

export function indent(editor) {
	
	logger('trace').log('indent')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('indent')
		level = level || '0'
		level = parseInt(level) + 1
		u(node).data('indent', level)
	})
	editor.emit('content:did-change', selection.head.container, selection.tail.container)
}

export function dedent(editor) {
	
	logger('trace').log('dedent')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('indent')
		level = level || '0'
		level = parseInt(level)
		level = level > 0 ? level - 1 : 0
		u(node).data('indent', level)
		if (level == 0) node.removeAttribute('data-indent') 
	})
	editor.emit('content:did-change', selection.head.container, selection.tail.container)
}
