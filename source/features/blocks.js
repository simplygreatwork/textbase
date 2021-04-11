
import { a_text_node } from '../basics.js'
import { zero_width_whitespace } from '../basics.js'
import { get_selection, set_selection, selection_each_block } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function toggle_block(editor, type) {						// todo: consolidate with transform_block below
	
	logger('trace').log('toggle_block')
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		node = u(node)
		let element = u(`<${type}>`)
		if (node.data('indent')) {
			element.data('indent', node.data('indent'))
		}
		node.replace(element)											// note: redo breaks if moved one line down
		node.children().each(function(each) {
			u(each).remove()
			element.append(each)
		})
	})
	set_selection(editor, selection)
	editor.emit('block-did-change', type)
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function transform_block(editor, node, type) {			// todo: consolidate with toggle_block above
	
	logger('trace').log('transform_block')
	let selection = get_selection(editor)
	node = u(node)
	let element = u(`<${type}>`)
	if (node.data('indent')) {
		element.data('indent', node.data('indent'))
	}
	node.replace(element)												// note: redo breaks if moved one line down
	node.children().each(function(each) {
		u(each).remove()
		element.append(each)
	})
	element = element.first()
	set_selection(editor, selection)
	editor.emit('block-did-change', type)
	editor.emit('content-did-change', element, element)
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

export function indent(editor, event) {
	
	logger('trace').log('indent')
	if (event && event.preventDefault) event.preventDefault()
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('indent')
		level = level || '0'
		level = parseInt(level) + 1
		u(node).data('indent', level)
	})
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function dedent(editor, event) {
	
	logger('trace').log('dedent')
	if (event && event.preventDefault) event.preventDefault()
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		let level = u(node).data('indent')
		level = level || '0'
		level = parseInt(level)
		level = level > 0 ? level - 1 : 0
		u(node).data('indent', level)
		if (level == 0) node.removeAttribute('data-indent') 
	})
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function align(editor, alignment) {
	
	logger('trace').log('align')
	let class_ = `align-${alignment}`
	let selection = get_selection(editor)
	selection_each_block(editor, selection, function(node) {
		node = u(node)
		node.removeClass('align-left')
		node.removeClass('align-right')
		node.removeClass('align-center')
		node.removeClass('align-justify')
		node.addClass(class_)
	})
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function block_has_content(block) {
	
	logger('trace').log('block_has_content')
	return u(block).text().trim().split(zero_width_whitespace).join('').length > 0
}
