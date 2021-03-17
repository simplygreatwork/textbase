
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { selection_each_block } from '../selection.js'
import { serialize } from '../serialize.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_block(editor, type) {
	
	logger('trace').log('toggle_block')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let element = u(`<${type}>`)
		u(node).children().each(function(each) {
			element.append(each)
		})
		u(node).replace(element)
	})
	// todo: restore selection
	editor.emit('content:did-change')
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
	blocks = JSON.parse(JSON.stringify(blocks))
	blocks.splice(blocks.indexOf(block), 1)
	return blocks
}

export function indent(editor) {
	
	logger('trace').log('indent')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('level')
		level = level || '0'
		level = parseInt(level) + 1
		u(node).data('level', level)
	})
	editor.emit('content:did-change')
}

export function dedent(editor) {
	
	logger('trace').log('dedent')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('level')
		level = level || '0'
		level = parseInt(level)
		level = level > 0 ? level - 1 : 0
		u(node).data('level', level)
	})
	editor.emit('content:did-change')
}
