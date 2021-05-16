
import { an_element_node, a_text_node } from './basics.js'
import { an_inline_element } from './basics.js'
import { get_selection } from './selection.js'
import { Logger } from './logger.js'
import { umbrella as u } from '../libraries/umbrella-enhanced.js'

const logger = Logger()

export function serialize(editor) {
	
	logger('trace').log('serialize')
	let bus = editor.bus
	let result = []
	let selection = get_selection(editor)
	let content = u(editor.element)
	content = clone(content, selection)
	bus.emit('document-will-serialize', content)
	apply_selection(selection)
	serialize_(content, [], result)
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

function apply_selection(selection) {
	
	if (! selection) return 
	apply_selection_(selection.tail, ']')
	apply_selection_(selection.head, '[')
}

function apply_selection_(component, string) {
	
	let node = component.container
	let offset = component.offset
	if (u(node).is(a_text_node)) {
		node.nodeValue = node.nodeValue.substring(0, offset) + string + node.nodeValue.substring(offset)
	} else if (u(node).is(an_element_node)) {
		return													// todo: insert brackets before or after the element
	}
}

function serialize_(node, level, result) {
	
	level.push('\t')
	node.contents().each(function(each) {
		if (u(each).is(an_element_node)) {
			let tag = each.tagName.toLowerCase()
			if (u(each).is(`${an_inline_element},pre,code`)) {
				result.push(`${serialize_tag_head(each)}`)
				serialize_(u(each), level, result)
				result.push(`</${tag}>`)
			} else {
				result.push(`\n${level.join('')}${serialize_tag_head(each)}`)
				serialize_(u(each), level, result)
				let tail = serialize_tag_tail(tag)
				if (tail) result.push(tail)
			}
		} else if (u(each).is(a_text_node)) {
			let text = u(each).text().trim()
			if (text.length > 0) result.push(text)
		}
	}.bind(this))
	level.pop()
}

function serialize_tag_head(node) {
	return u(node).clone().empty().first().outerHTML.split('><')[0] + '>'
}

function serialize_tag_tail(tag) {
	
	if (tag == 'img') {
		return null
	} else {
		return `</${tag}>`
	}
}
