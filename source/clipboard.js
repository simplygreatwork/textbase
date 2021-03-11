
import { get_selection, set_caret, normalize_selection, selection_edge } from './selection.js'
import { node_iterator, a_text_node, a_span_node } from './basics.js'
import { block, inline } from './basics.js'
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
	var clip = document.createElement('internal-transfer')
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
	var clip = document.createElement('internal-transfer')
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
		let node = u(content)
		if (node.children().length === 0) {
			let selection = get_selection(editor)
			selection.range.deleteContents()
			editor.insert_string(node.text())
		} else {
			let selection = get_selection(editor)
			let edges = selection_edge(editor, selection)
			selection.range.deleteContents()
			let part
			let each_
			node.children().each(function(each) {
				each_ = u(each)
				if (each_.is(inline)) {
					u(edges[0]).before(each_)
				} else if (each_.is(block)) {
					if (part == null) {
						let parts = editor.split_content(block)
						part = u(parts[0])
					}
					part.after(each_)
					part = each_
				}
			})
			set_caret(editor, { container: edges[0], offset: 0 })
			normalize_selection(editor)
			editor.emit('content:did-change')
		}
	}
}

function is_internal_transfer(node) {
	
	return u(node).first().tagName == 'internal-transfer'.toUpperCase()
}
