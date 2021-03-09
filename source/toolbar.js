
import { toggle_format, remove_formats, find_active_formats, find_applicable_formats } from './features/formats.js'
import { toggle_block, find_active_block, find_applicable_blocks } from './features/blocks.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Toolbar {
	
	constructor(bus) {
		
		this.bus = bus
		bus.on('selection:did-change', function(event, editor) {
			logger('toolbar').log('toolbar:selection:did-change')
			let blocks = ['p','h1','h2','h3','ul','ol, li']
			let active_formats = find_active_formats(editor)
			let applicable_formats = find_applicable_formats(editor)
			let active_block = find_active_block(editor, blocks)
			let applicable_blocks = find_applicable_blocks(editor, blocks)
			u('.toolbar').find('button').each(function(each) {
				u(each).removeClass('active')
			}.bind(this))
			u('.toolbar').find(`button[data-element=${active_block}]`).addClass('active')
			active_formats.forEach(function(format) {
				u('.toolbar').find(`button[data-format=${format}]`).addClass('active')
			})
		})
	}
	
	append(html) {
		
		let element = u(html)
		let action = element.data('action')
		element.on('click', function() {
			this.bus.emit('action.request', action)
			this.bus.emit(`action.request.${action}`)
		}.bind(this))
		u('.toolbar').append(element)
	}
}

export default { Toolbar }
