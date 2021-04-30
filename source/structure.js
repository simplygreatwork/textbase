
import { Bus } from './bus.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Structure {
	
	constructor(bus, editor) {
		
		this.bus = bus
		this.editor = editor
		this.should_render = true
	}
	
	toggle() {
		
		this.should_render = ! this.should_render
		if (this.should_render) {
			this.render()
			u('.structure').removeClass('structure-off')
		} else {
			u('.structure').addClass('structure-off')
		}
	}
	
	render() {
		
		if (this.should_render === false) return
		let content = this.render_ ? serialize(this.editor) : ''
		document.querySelector('.structure-html').textContent = content
	}
}
