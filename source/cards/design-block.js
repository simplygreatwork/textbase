
import { inject_stylesheet } from '../basics.js'
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(bus, editor, history) {
	
	inject_stylesheet(`<link rel="stylesheet" type="text/css" href="./source/cards/design-block.css"/>`)
	
	bus.on('action:card-designed', function() {
		insert_card(editor, 'designed', `
			<div class="hero">
				<span class="hero-text" contenteditable="true">
					<span>Hero</span>
				</span>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:designed', function(card) {
		logger('system').log('card-will-enter:designed')
	}.bind(this))
	
	bus.on('card-did-enter:designed', function(card) {
		logger('system').log('card-did-enter:designed')
	}.bind(this))
	
	bus.on('card-will-exit:designed', function(card) {
		logger('system').log('card-will-exit:designed')
	}.bind(this))
	
	bus.on('card-did-exit:designed', function(card) {
		logger('system').log('card-did-exit:designed')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'card-designed', 'Card: Design Block')
}
