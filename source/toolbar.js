
import { an_inline_element, a_block_element } from './basics.js'
import { toggle_format, remove_formats, find_active_formats, find_applicable_formats } from './features/formats.js'
import { toggle_block, find_active_block, find_applicable_blocks } from './features/blocks.js'
import { Logger } from './logger.js'
import { umbrella as u } from '../libraries/umbrella-enhanced.js'

const logger = Logger()

export class Toolbar {
	
	constructor(element, bus) {
		
		this.element = element
		this.bus = bus
		
		bus.on('selection-did-change', function(event, editor) {
			logger('toolbar').log('toolbar:selection-did-change')
			let active_formats = find_active_formats(editor)
			let applicable_formats = find_applicable_formats(editor)
			let active_block = find_active_block(editor, a_block_element)
			let applicable_blocks = find_applicable_blocks(editor, a_block_element)
			let toolbar = u(this.element)
			toolbar.find('button').each(function(each) {
				u(each).removeClass('active')
			}.bind(this))
			toolbar.find(`button[data-block=${active_block}]`).addClass('active')
			active_formats.forEach(function(format) {
				toolbar.find(`button[data-format=${format}]`).addClass('active')
			})
		})
	}
	
	append(html) {
		u(this.element).append(this.create_element(html))
	}
	
	before(html, node) {
		u(node).before(this.create_element(html))
	}
	
	after(html, node) {
		u(node).after(this.create_element(html))
	}
	
	create_element(html) {
		
		let element = u(html)
		element.on('click', function() {
			let action = element.data('action')
			let event = null
			this.bus.emit('action', action)
			this.bus.emit(`action:${action}`, event)				// null event to ensure that a bus interruptable does not replace event
		}.bind(this))
		return element
	}
}
