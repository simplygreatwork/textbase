
import { a_text_node, node_iterator } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
import { get_selection, set_caret, selection_edge, normalize_selection } from './selection.js'
import { sanitize } from './sanitize.js'
import { Logger } from './logger.js'

const logger = Logger()

export function initialize_clipboard(editor) {
	
	let bus = editor.bus
	let target = editor.element
	
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
		let clip = document.createElement('internal-transfer')
		clip.appendChild(fragment.cloneNode(true))
		let content = clip.outerHTML
		logger('trace').log('cut content: ' + content)
		event.clipboardData.setData('text/html', content)
	}.bind(this))
	
	bus.on('clipboard-copy', function(event, editor) {
		logger('trace').log('event:copy')
		event.preventDefault()
		let selection = get_selection(editor)
		if (selection == null) return
		let range = selection.range
		let fragment = range.cloneContents()
		let clip = document.createElement('internal-transfer')
		clip.appendChild(fragment.cloneNode(true))
		let content = clip.outerHTML
		logger('trace').log('copy content: ' + content)
		event.clipboardData.setData('text/html', content)
		event.clipboardData.setData('text/plain', u(fragment).text())
	}.bind(this))
	
	bus.on('clipboard-paste', function(event, editor) {		// todo: need to edge selection
		logger('trace').log('event:paste')
		event.preventDefault()
		let clipboard_data = (event.clipboardData || window.clipboardData)
		let content = clipboard_data.getData('text/html')
		logger('trace').log('paste content: ' + content)
		if (is_internal_transfer(content)) {
			paste_internally(content, editor)
		}
	}.bind(this))
}

function paste_internally(content, editor) {
	
	let bus = editor.bus
	let node = u(content)
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	if (node.children().length === 0) {
		content = extract_internal_transfer(content)
		insert_string(content, editor, bus)
		editor.emit('content-did-change', edges[1], edges[0])
		editor.emit('clipboard-did-paste')
	} else {
		let part = null
		node.children().each(function(each) {
			each = u(each)
			if (each.is(an_inline_element)) {
				insert_inline(edges[0], each.first(), editor, bus)
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
		editor.emit('content-did-change', edges[1], edges[0])
		editor.emit('clipboard-did-paste')
	}
}

function insert_string(string, editor, bus) {
	
	editor.insert_string(string)
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

function is_internal_transfer(node) {
	return u(node).first().tagName == 'internal-transfer'.toUpperCase()
}

function extract_internal_transfer(node) {
	return u(node).first().innerHTML
}
