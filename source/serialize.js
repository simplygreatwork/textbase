
import { an_element_node, a_text_node } from './basics.js'
import { an_inline_element } from './basics.js'
import { get_selection } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function serialize(editor) {
	
	logger('trace').log('serialize')
	let bus = editor.bus
	let result = []
	let selection = get_selection(editor)
	let content = u(editor.element)
	content = clone(content, selection)
	bus.emit('document-will-serialize', content)
	serialize_(selection, content, [], result)
	bus.emit('document-did-serialize', content)
	return result.join('')
}

function clone(content, selection) {
	
	return content.clone({
		map_selections: function(src, dest) {
			if (! selection) return
			if (selection.head.container == src.firstChild) selection.head.container = dest.firstChild
			if (selection.tail.container == src.firstChild) selection.tail.container = dest.firstChild
		}
	})
}

export function serialize_(selection, node, level, result) {
	
	level.push('\t')
	node.contents().each(function(each) {
		if (u(each).is(an_element_node)) {
			if (selection && selection.range) {
				if (each == selection.tail.container) result.push(']')
				if (each == selection.head.container) result.push('[')
			}
			let tag = each.tagName.toLowerCase()
			if (u(each).is(an_inline_element)) {
				result.push(`${serialize_tag_head(each)}`)
				serialize_(selection, u(each), level, result)
				result.push(`</${tag}>`)
			} else {
				result.push('\n')
				result.push(`${level.join('')}${serialize_tag_head(each)}`)
				serialize_(selection, u(each), level, result)
				let tail = serialize_tag_tail(tag)
				if (tail) result.push(tail)
			}
		} else if (u(each).is(a_text_node)) {
			let text = u(each).text()
			if (selection && selection.range) {
				text = render_text_node_selection(text, each, selection.tail, ']')
				text = render_text_node_selection(text, each, selection.head, '[')
			}
			text = text.trim()
			if (text.length > 0) result.push(text.trim())
		}
	}.bind(this))
	level.pop()
}

function render_text_node_selection(text, node, part, character) {
	
	if (node == part.container) {
		let offset = part.offset
		return text.substring(0, offset) + character + text.substring(offset)
	}
	return text
}

export function serialize_tag_head(node) {
	return u(node).clone().empty().first().outerHTML.split('><')[0] + '>'
}

export function serialize_tag_tail(tag) {
	
	if (tag == 'img') {
		return null
	} else {
		return `</${tag}>`
	}
}
