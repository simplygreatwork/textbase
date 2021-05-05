
import { a_text_node, node_iterator } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
import { get_selection, set_caret, selection_edge, normalize_selection } from './selection.js'
import { Sanitizer } from './sanitizer.js'
import { Logger } from './logger.js'

const logger = Logger()

export function initialize_clipboard(editor, sanitizer) {
	
	let bus = editor.bus
	let target = editor.element
	if (true) sanitizer.example()
	
	target.addEventListener('cut', function(event) {
		bus.emit('clipboard-will-cut', event, editor)
		bus.emit('clipboard-cut', event, editor)
		bus.emit('clipboard-did-cut', event, editor)
	})
	
	target.addEventListener('copy', function(event) {
		bus.emit('clipboard-will-copy', event, editor)
		bus.emit('clipboard-copy', event, editor)
		bus.emit('clipboard-did-copy', event, editor)
	})
	
	target.addEventListener('paste', function(event) {
		bus.emit('clipboard-will-paste', event, editor)
		bus.emit('clipboard-paste', event, editor)
		bus.emit('clipboard-did-paste', event, editor)
	})
	
	bus.on('clipboard-cut', function(event, editor) {
		logger('trace').log('event:cut')
		event.preventDefault()
		let selection = get_selection(editor)
		if (selection == null) return
		let range = selection.range
		let fragment = range.extractContents()
		let div = document.createElement('div')
		div.appendChild(fragment.cloneNode(true))
		let content = div.outerHTML
		logger('clipboard').log('cut content: ' + content)
		let clipboard_data = (event.clipboardData || window.clipboardData)
		clipboard_data.setData('text/html', content)
		clipboard_data.setData('textbase/text/html', content)
		clipboard_data.setData('text/plain', u(fragment).text())
		clipboard_data.setData('textbase/text/plain', u(fragment).text())
	}.bind(this))
	
	bus.on('clipboard-copy', function(event, editor) {
		logger('trace').log('event:copy')
		event.preventDefault()
		let selection = get_selection(editor)
		if (selection == null) return
		let range = selection.range
		let fragment = range.cloneContents()
		let div = document.createElement('div')
		div.appendChild(fragment.cloneNode(true))
		let content = div.outerHTML
		logger('clipboard').log('copy content: ' + content)
		let clipboard_data = (event.clipboardData || window.clipboardData)
		clipboard_data.setData('text/html', content)
		clipboard_data.setData('textbase/text/html', content)
		clipboard_data.setData('text/plain', u(fragment).text())
		clipboard_data.setData('textbase/text/plain', u(fragment).text())
	}.bind(this))
	
	bus.on('clipboard-paste', function(event, editor) {				// todo: need to edge selection
		logger('trace').log('event:paste')
		event.preventDefault()
		let clipboard_data = (event.clipboardData || window.clipboardData)
		logger('clipboard').log('pastable data types: ' + Array.from(clipboard_data.types).join(' : '))
		if (clipboard_data.types.indexOf('textbase/text/html') > -1) {
			let content = clipboard_data.getData('textbase/text/html')
			logger('clipboard').log('paste content: ' + content)
			if (u(content).children().length === 0) {
				content = u(content).first().innerHTML
				paste_plain_text(content, editor)
			} else {
				paste_html_text(content, editor)
			}
		} else if (clipboard_data.types.indexOf('text/html') > -1) {
			let content = clipboard_data.getData('text/html')
			content = `<div>${sanitizer.sanitize(content)}</div>`
			paste_html_text(content, editor)
		} else if (clipboard_data.types.indexOf('textbase/text/plain') > -1) {
			let content = clipboard_data.getData('textbase/text/plain')
			logger('clipboard').log('paste content: ' + content)
			paste_plain_text(content, editor)
		} else if (clipboard_data.types.indexOf('text/plain') > -1) {
			let content = clipboard_data.getData('text/plain')
			logger('clipboard').log('paste content: ' + content)
			paste_plain_text(content, editor)
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

function paste_html_text(content, editor) {
	
	let bus = editor.bus
	let node = u(content)
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	let part = null
	node.children().each(function(each) {
		each = u(each)
		if (each.is(an_inline_element)) {
			insert_inline(edges[0], each, editor, bus)
		} else if (each.is(a_block_element)) {
			if (part === null) {
				part = u(editor.split_content(a_block_element)[0])
			}
			insert_block(part, each, editor, bus)
			part = each
		}
	})
	set_caret(editor, { container: edges[0], offset: 0 })
	normalize_selection(editor)
	bus.emit('content-did-change', edges[1], edges[0])
	bus.emit('clipboard-did-paste')
}

function paste_plain_text(content, editor) {
	
	let bus = editor.bus
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	editor.insert_string(content)
	bus.emit('content-did-change', edges[1], edges[0])
	bus.emit('clipboard-did-paste')
}

function insert_inline(parent, node, editor, bus) {
	
	node = node.first()
	bus.emit('content-will-insert', node, bus)
	u(parent).before(node)
	bus.emit('content-did-insert', node, bus)
}

function insert_block(parent, node, editor, bus) {
	
	node = node.first()
	bus.emit('content-will-insert', node, bus)
	u(parent).after(node)
	bus.emit('content-did-insert', node, bus)
}
