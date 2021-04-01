
import { get_selection, set_caret, normalize_selection, selection_edge } from './selection.js'
import { node_iterator, a_text_node } from './basics.js'
import { an_inline_element, a_block_element } from './basics.js'
import { sanitize } from './sanitize.js'
import { Logger } from './logger.js'

const logger = Logger()

export function initialize_clipboard(editor) {
	
	let target = editor.element
	target.addEventListener('cut', function(event) {
		cut(event, editor)
	})
	target.addEventListener('copy', function(event) {
		copy(event, editor)
	})
	target.addEventListener('paste', function(event) {
		paste(event, editor)
	})
}

export function cut(event, editor) {
	
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
}

export function copy(event, editor) {
	
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
}

export function paste(event, editor) {  	//todo: need to edge selection
	
	logger('trace').log('event:paste')
	event.preventDefault()
	let clipboard_data = (event.clipboardData || window.clipboardData)
	let content = clipboard_data.getData('text/html')
	logger('trace').log('paste content: ' + content)
	if (is_internal_transfer(content)) {
		paste_internally(content, editor)
	}
}

function paste_internally(content, editor) {
	
	let bus = editor.bus
	let node = u(content)
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	selection.range.deleteContents()
	if (node.children().length === 0) {
		bus.emit('content-will-insert', content, bus)
		editor.insert_string(node.text())
		bus.emit('content-did-insert', content, bus)
		editor.emit('content-did-change', edges[1], edges[0])
		editor.emit('clipboard-did-paste')
	} else {
		let part = null
		node.children().each(function(each) {
			each = u(each)
			if (each.is(an_inline_element)) {
				bus.emit('content-will-insert', each.first(), bus)
				u(edges[0]).before(each)
				bus.emit('content-did-insert', each.first(), bus)
			} else if (each.is(a_block_element)) {
				if (part === null) {
					part = u(editor.split_content(a_block_element)[0])
				}
				bus.emit('content-will-insert', each.first(), bus)
				part.after(each)
				bus.emit('content-did-insert', each.first(), bus)
				part = each
			}
		})
		set_caret(editor, { container: edges[0], offset: 0 })
		normalize_selection(editor)
		editor.emit('content-did-change', edges[1], edges[0])
		editor.emit('clipboard-did-paste')
	}
}

function is_internal_transfer(node) {
	return u(node).first().tagName == 'internal-transfer'.toUpperCase()
}
