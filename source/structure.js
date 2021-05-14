
import { Bus } from './bus.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Structure {
	
	constructor(bus, element, editor) {
		
		this.bus = bus
		this.element = element
		this.editor = editor
		this.should_render = true
	}
	
	toggle() {
		
		this.should_render = ! this.should_render
		if (this.should_render) {
			this.render()
			u(this.element).removeClass('structure-off')
		} else {
			u(this.element).addClass('structure-off')
		}
	}
	
	render() {
		
		if (this.should_render === false) return
		let content = this.should_render ? serialize(this.editor) : ''
		this.element.textContent = content
	}
}
