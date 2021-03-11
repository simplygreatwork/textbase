
import { get_selection } from './selection.js'
import { Logger } from './logger.js'

const logger = Logger()

export function serialize(editor) {
	
	logger('trace').log('serialize')
	let result = []
	let selection = get_selection(editor)
	serialize_(selection, u(editor.element), [], result)
	return result.join('')
}

export function serialize_(selection, node, level, result) {
	
	level.push('\t')
	node.contents().each(function(each) {
		if (each.nodeType === 1) {
			let tag = each.tagName.toLowerCase()
			if (selection && selection.range) {
				if (each == selection.tail.container) result.push(']')
				if (each == selection.head.container) result.push('[')
			}
			if (tag == 'span') {
				result.push(`${serialize_tag_head(each)}`)
				serialize_(selection, u(each), level, result)
				result.push(`</${tag}>`)
			} else {
				result.push('\n')
				result.push(`${level.join('')}${serialize_tag_head(each)}`)
				serialize_(selection, u(each), level, result)
				result.push('\n')
				result.push(`${level.join('')}</${tag}>`)
			}
		} else if (each.nodeType === 3) {
			let text = u(each).text()
			if (selection && selection.range) {
				if (each == selection.tail.container) {
					let offset = selection.tail.offset
					text = text.substring(0, offset) + ']' + text.substring(offset)
				}
				if (each == selection.head.container) {
					let offset = selection.head.offset
					text = text.substring(0, offset) + '[' + text.substring(offset)
				}
			}
			text = text.trim()
			if (text.length > 0) result.push(text.trim())
		}
	}.bind(this))
	level.pop()
}

export function serialize_tag_head(node) {
	return u(node).clone().empty().first().outerHTML.split('><')[0] + '>'
}

export function unserialize() {
	return
}

export function unserialize_() {
	return
}
