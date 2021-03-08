
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { selection_each_block } from '../selection.js'
import { serialize } from '../serialize.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_block(editor, type) {
	
	logger('trace').log('toggle_block')
	let selection = get_selection(editor.element)
	selection_each_block(editor, selection, function(node) {
		let element = u(`<${type}>`)
		u(node).children().each(function(each) {
			element.append(each)
		})
		u(node).replace(element)
	})
	editor.emit('content:did-change')
}

export function find_active_block(editor, blocks) {
	
	let selection = get_selection(editor.element)
	let node = u(selection.head.container)
	if (node.is(a_text_node)) node = node.parent()
	let ancestor = node.closest(blocks).first()
	return ancestor.tagName.toLowerCase()
}

export function find_applicable_blocks(editor, blocks) {
	
	let block = find_active_block(editor, blocks)
	blocks = JSON.parse(JSON.stringify(blocks))
	blocks.splice(blocks.indexOf(block), 1)
	return blocks
}
