
import { a_text_node, node_iterator } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
import { consume_event, get_clipboard_data } from './basics.js'
import { get_selection, set_caret, selection_edge, normalize_selection } from './selection.js'
import { Sanitizer } from './sanitizer.js'
import { Logger } from './logger.js'

const logger = Logger()

export function initialize_clipboard(bus, editor, sanitizer) {
	
	let target = editor.element
	
	target.addEventListener('cut', function(event) {
		bus.emit('clipboard-will-cut', event)
		bus.emit('clipboard-cut', event)
		bus.emit('clipboard-did-cut', event)
	})
	
	target.addEventListener('copy', function(event) {
		bus.emit('clipboard-will-copy', event)
		bus.emit('clipboard-copy', event)
		bus.emit('clipboard-did-copy', event)
	})
	
	target.addEventListener('paste', function(event) {
		bus.emit('clipboard-will-paste', event)
		bus.emit('clipboard-paste', event)
		bus.emit('clipboard-did-paste', event)
	})
	
	bus.on('clipboard-cut', function(event) {
		logger('trace').log('clipboard-cut')
		consume_event(event)
		let selection = get_selection(editor)
		if (selection == null) return
		let fragment = selection.range.cloneContents()
		bus.emit('content-will-delete', fragment)
		let content = content_from(selection.range.extractContents())
		logger('clipboard').log('cut content: ' + content)
		let data = get_clipboard_data(event)
		data.setData('text/html', content)
		data.setData('textbase/text/html', content)
		data.setData('text/plain', u(content).text())
		data.setData('textbase/text/plain', u(content).text())
		bus.emit('content-did-change', selection.head.container, selection.tail.container)
		bus.emit('content-did-delete', fragment)
	}.bind(this))
	
	bus.on('clipboard-copy', function(event) {
		logger('trace').log('clipboard-copy')
		consume_event(event)
		let selection = get_selection(editor)
		if (selection == null) return
		let content = content_from(selection.range.cloneContents())
		logger('clipboard').log('copy content: ' + content)
		let data = get_clipboard_data(event)
		data.setData('text/html', content)
		data.setData('textbase/text/html', content)
		data.setData('text/plain', u(content).text())
		data.setData('textbase/text/plain', u(content).text())
	}.bind(this))
	
	bus.on('clipboard-paste', function(event) {							// todo: need to edge selection
		logger('trace').log('clipboard-paste')
		consume_event(event)
		let data = get_clipboard_data(event)
		logger('clipboard').log('pastable data types: ' + Array.from(data.types).join(' : '))
		if (data.types.includes('textbase/text/html')) {
			let content = data.getData('textbase/text/html')
			logger('clipboard').log('paste content: ' + content)
			if (u(content).children().length === 0) {
				paste_plain_text(bus, editor, u(content).first().innerHTML)
			} else {
				paste_html_text(bus, editor, content)
			}
		} else if (data.types.includes('text/html')) {
			let content = data.getData('text/html')
			logger('clipboard').log('paste content: ' + content)
			content = `<div>${sanitizer.sanitize(content)}</div>`
			paste_html_text(bus, editor, content)
		} else if (data.types.includes('textbase/text/plain')) {
			let content = data.getData('textbase/text/plain')
			logger('clipboard').log('paste content: ' + content)
			paste_plain_text(bus, editor, content)
		} else if (data.types.includes('text/plain')) {
			let content = data.getData('text/plain')
			logger('clipboard').log('paste content: ' + content)
			paste_plain_text(bus, editor, content)
		}
	}.bind(this))
	
	bus.on('clipboard-paste:textbase/text/html', function(event, editor) {
		return
	}.bind(this))
	
	bus.on('clipboard-paste:textbase/text/plain', function(event, editor) {
		return
	}.bind(this))
	
	bus.on('clipboard-paste:text/html', function(event, editor) {
		return
	}.bind(this))
	
	bus.on('clipboard-paste:text/plain', function(event, editor) {
		return
	}.bind(this))
}

function content_from(fragment) {
	
	let div = document.createElement('div')
	div.appendChild(fragment.cloneNode(true))
	return div.outerHTML
}

function paste_html_text(bus, editor, content) {
	
	let node = u(content)
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	let part = null
	node.children().each(function(each) {
		each = u(each)
		if (each.is(an_inline_element)) {
			insert_inline(bus, edges[0], each)
		} else if (each.is(a_block_element)) {
			if (part === null) {
				part = u(editor.split_content(a_block_element)[0])
			}
			insert_block(bus, part, each)
			part = each
		}
	})
	set_caret(editor, { container: edges[0], offset: 0 })
	normalize_selection(editor)
	bus.emit('content-did-change', edges[1], edges[0])
	bus.emit('clipboard-did-paste')
}

function paste_plain_text(bus, editor, content) {
	
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	editor.insert_string(content)
	bus.emit('content-did-change', edges[1], edges[0])
	bus.emit('clipboard-did-paste')
}

function insert_inline(bus, parent, node) {
	
	node = node.first()
	bus.emit('content-will-insert', node, bus)
	u(parent).before(node)
	bus.emit('content-did-insert', node, bus)
}

function insert_block(bus, parent, node) {
	
	node = node.first()
	bus.emit('content-will-insert', node, bus)
	u(parent).after(node)
	bus.emit('content-did-insert', node, bus)
}
