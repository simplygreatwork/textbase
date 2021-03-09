
import { get_selection, normalize_selection, selection_edge } from './selection.js'
import { node_iterator, a_text_node, a_span_node } from './basics.js'
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
	let selection = get_selection(editor.element)
	if (selection == null) return
	let range = selection.range
	let fragment = range.extractContents()
	var clip = document.createElement('internal-clip')
	clip.appendChild(fragment.cloneNode(true))
	let content = clip.outerHTML
	logger('trace').log('cut content: ' + content)
	event.clipboardData.setData('text/html', content)
}

export function copy(event, editor) {
	
	logger('trace').log('event:copy')
	event.preventDefault()
	let selection = get_selection(editor.element)
	if (selection == null) return
	let range = selection.range
	let fragment = range.cloneContents()
	var clip = document.createElement('internal-clip')
	clip.appendChild(fragment.cloneNode(true))
	let content = clip.outerHTML
	logger('trace').log('copy content: ' + content)
	event.clipboardData.setData('text/html', content)
}

export function paste(event, editor) {  	//todo: need to edge selection?
	
	logger('trace').log('event:paste')
	event.preventDefault()
	let clipboard_data = (event.clipboardData || window.clipboardData)
	let content = clipboard_data.getData('text/html')
	logger('trace').log('paste content: ' + content)
	if (! editor.is_editable()) return
	let selection = get_selection(editor.element)
	selection_edge(this, selection)
	selection.range.deleteContents()
	let fragment = document.createDocumentFragment()
	if (is_internal_clipping(content)) {
		let node = u(content)
		if (node.children().length === 0) {
			fragment.appendChild(u('<span>').text(node.text()).wrap('<p>').first())
		} else {
			let spans = []
			node.children().each(function(each) {
				let each_ = u(each)
				if (each_.is(a_span_node)) {
					spans.push(each_)
				} else {
					enclose(spans, fragment)
					fragment.appendChild(each_.first())
				}
			})
			enclose(spans, fragment)
		}
	}
	let parts = editor.split_content('p,h1,h2,li')
	let part = u(parts[0])
	let div = document.createElement('div')
	div.appendChild(fragment)
	u(div.innerHTML).each(function(each) {
		let node = u(each.outerHTML)
		part.after(node)
		part = node
	})
	normalize_selection(editor)
	editor.emit('content:did-change')
}

function enclose(spans, fragment) {
	
	if (spans.length > 0) {
		let p = u('<p>')
		spans.forEach(function(each) {
			p.append(u(each))
		})
		fragment.appendChild(p.first())
		spans.slice(0)
	}
}

function is_internal_clipping(node) {
	
	return u(node).first().tagName == 'internal-clip'.toUpperCase()
}
