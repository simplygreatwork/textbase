
import { get_selection } from './selection.js'
import { node_iterator, a_text_node } from './basics.js'
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
	let range = get_selection(editor.element).range
	let fragment = range.extractContents()
	var clip = document.createElement('internal-clip')
	clip.appendChild(fragment.cloneNode(true))
	let content = clip.outerHTML
	logger('trace').log('cut content: ' + content)
	event.clipboardData.setData('text/html', content)
}

export function copy(event) {
	
	logger('trace').log('event:copy')
	event.preventDefault()
	let range = get_selection(editor.element).range
	let fragment = range.cloneContents()
	var clip = document.createElement('internal-clip')
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
	let node = u(content)
	var fragment = document.createDocumentFragment()
	if (node.first().tagName != 'internal-clip'.toUpperCase()) {
		node = sanitize(node)
		return
	}
	if (node.children().length === 0) {
		fragment.appendChild(u('<span>').text(node.text()).first())
	} else {
		node.children().each(function(each) {
			let each_ = u(each)
			if (each_.is(a_text_node)) {
				each_ = each_.wrap('<span>')
			}
			fragment.appendChild(each_.first())
		})
	}
	fragment = sanitize(fragment)
	editor.insert_content(fragment)
}
