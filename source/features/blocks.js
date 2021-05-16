
import { a_text_node } from '../basics.js'
import { zero_width_whitespace } from '../basics.js'
import { get_selection, set_selection, selection_each_block } from '../selection.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system, blocks) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	blocks = blocks || ['paragraph', 'heading-1', 'heading-2', 'list-item', 'blockquote', 'indentation', 'alignment']
	if (false) blocks.append('ordered-list') 
	if (false) blocks.append('unordered-list') 
	
	bus.on('feature:block-paragraph', function() {
		bus.on('action:paragraph', function() {
			toggle_block(editor, 'p')
		}.bind(this))
		bus.emit('feature-did-enable', 'paragraph', 'Paragraph', 'block', 'p')
	}.bind(this))
	
	bus.on('feature:block-heading-1', function() {
		bus.on('action:heading-1', function() {
			toggle_block(editor, 'h1')
		}.bind(this))
		bus.emit('feature-did-enable', 'heading-1', 'Heading 1', 'block', 'h1')
	}.bind(this))
	
	bus.on('feature:block-heading-2', function() {
		bus.on('action:heading-2', function() {
			toggle_block(editor, 'h2')
		}.bind(this))
		bus.emit('feature-did-enable', 'heading-2', 'Heading 2', 'block', 'h2')
	}.bind(this))
	
	bus.on('feature:block-list-item', function() {
		bus.on('action:list-item', function() {
			toggle_block(editor, 'li')
		}.bind(this))
		bus.emit('feature-did-enable', 'list-item', 'List Item', 'block', 'li')
	}.bind(this))
	
	bus.on('feature:block-ordered-list', function() {
		bus.on('action:ordered-list', function() {
			toggle_block(editor, 'ol')
		}.bind(this))
		bus.emit('feature-did-enable', 'ordered-list', 'Ordered List', 'block', 'ol')
	}.bind(this))
	
	bus.on('feature:block-unordered-list', function() {
		bus.on('action:unordered-list', function() {
			toggle_block(editor, 'ul')
		}.bind(this))
		bus.emit('feature-did-enable', 'unordered-list', 'Unordered List', 'block', 'ul')
	}.bind(this))
	
	bus.on('feature:block-blockquote', function() {
		bus.on('action:blockquote', function() {
			toggle_block(editor, 'blockquote')
		}.bind(this))
		bus.emit('feature-did-enable', 'blockquote', 'Blockquote', 'block', 'blockquote')
	}.bind(this))
	
	bus.on('feature:block-indentation', function() {
		bus.on('action:indent', function(event) {
			indent(editor, event)
		}.bind(this))
		bus.on('keydown:tab', function(event) {
			bus.emit('action:indent', event)
		}.bind(this))
		bus.on('keydown:control-]', function(event) {
			bus.emit('action:indent', event)
		}.bind(this))
		bus.emit('feature-did-enable', 'indent', 'Indent')
		bus.on('action:dedent', function(event) {
			dedent(editor, event)
		}.bind(this))
		bus.on('keydown:shift-tab', function(event) {
			bus.emit('action:dedent', event)
		}.bind(this))
		bus.on('keydown:control-[', function(event) {
			bus.emit('action:dedent', event)
		}.bind(this))
		bus.emit('feature-did-enable', 'dedent', 'Dedent')
	}.bind(this))
	
	bus.on('feature:block-alignment', function() {
		bus.on('action:align-left', function() {
			align(editor, 'left')
		}.bind(this))
		bus.emit('feature-did-enable', 'align-left', 'Align Left')
		bus.on('action:align-right', function() {
			align(editor, 'right')
		}.bind(this))
		bus.emit('feature-did-enable', 'align-right', 'Align Right')
		bus.on('action:align-center', function() {
			align(editor, 'center')
		}.bind(this))
		bus.emit('feature-did-enable', 'align-center', 'Align Center')
		bus.on('action:align-justify', function() {
			align(editor, 'justify')
		}.bind(this))
		bus.emit('feature-did-enable', 'align-justified', 'Align Justify')
	}.bind(this))
	
	bus.on('block-did-change', function(event) {
		history.capture()
	}.bind(this))
	
	bus.on('content-did-split', function(a, b) {
		if (block_has_content(a)) return
		if (block_has_content(b)) return
		transform_block(editor, b, 'p')
	}.bind(this))
	
	blocks.forEach(function(block) {
		bus.emit(`feature`, `block-${block}`)
	})
}

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
	set_selection(editor, selection)
	editor.emit('block-did-change')
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
	set_selection(editor, selection)
	editor.emit('block-did-change')
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
	set_selection(editor, selection)
	editor.emit('block-did-change')
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function block_has_content(block) {
	
	logger('trace').log('block_has_content')
	return u(block).text().trim().split(zero_width_whitespace).join('').length > 0
}
