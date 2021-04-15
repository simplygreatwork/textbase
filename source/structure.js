
import { Bus } from './bus.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Structure {
	
	constructor(bus, editor) {
		
		this.bus = bus
		this.editor = editor
		this.render_ = true
	}
	
	toggle() {
		
		this.render_ = !this.render_
		this.render()
	}
	
	render() {
		
		let content = this.render_ ? serialize(this.editor) : ''
		document.querySelector('.structure-html').textContent = content
	}
}
