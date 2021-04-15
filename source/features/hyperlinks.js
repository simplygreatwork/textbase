
import { an_inline_element } from '../basics.js'
import { element_iterator, an_element_node, a_text_node } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_hyperlinks(editor, bus) {
	
	logger('trace').log('initialize_hyperlinks')
	u(editor.element).on('click', function(event) {
		invoke_hyperlink(u(event.target), editor, bus)
	})
}

export function detect_hyperlinks(editor, bus) {
	
	bus.on('keydown:shift-space', function(event) {
		logger('trace').log('detect_hyperlink keydown:space')
	})
}

function invoke_hyperlink(target, editor, bus) {
	
	logger('trace').log('invoke_hyperlink')
	if (target.is(an_inline_element)) {
		if (target.hasClass('hyperlink')) {
			let href = find_href(editor, event.target)
			bus.emit('hyperlink:clicked', href, event)
		}
	}
}

function find_href(editor, node) {
	
	let result = null
	let iterator = element_iterator(editor.element, node)
	while (node) {
		if (u(node).hasClass('hyperlink')) {
			let href = u(node).data('href')
			if (href) {
				result = href
				break
			}
		}
		node = iterator.nextNode()
	}
	return result
}
