
import { an_inline_element } from '../basics.js'
import { element_iterator, an_element_node, a_text_node } from '../basics.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize_pseudolinks(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	logger('trace').log('initialize_pseudolinks')
	u(editor.element).on('click', function(event) {
		invoke_pseudolink(u(event.target), editor, bus)
	})
}

export function detect_pseudolinks(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	bus.on('keydown:shift-space', function(event) {
		logger('trace').log('detect_pseudolink keydown:space')
	})
}

function invoke_pseudolink(target, editor, bus) {
	
	logger('trace').log('invoke_pseudolink')
	if (target.is(an_inline_element)) {
		if (target.hasClass('pseudolink')) {
			let href = find_href(editor, event.target)
			bus.emit('pseudolink:clicked', href, event)
		}
	}
}

function find_href(editor, node) {
	
	let result = null
	let iterator = element_iterator(editor.element, node)
	while (node) {
		if (u(node).hasClass('pseudolink')) {
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
