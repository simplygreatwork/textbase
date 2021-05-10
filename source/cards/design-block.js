
import { inject_stylesheet } from '../basics.js'
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(bus, editor, history) {
	
	inject_stylesheet(`<link rel="stylesheet" type="text/css" href="./source/cards/design-block.css"/>`)
	
	bus.on('action:card-design-block', function() {
		insert_card(editor, 'design-block', `
			<div class="hero">
				<span class="hero-text" contenteditable="true">
					<span>Hero</span>
				</span>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:design-block', function(card) {
		logger('system').log('card-will-enter:design-block')
	}.bind(this))
	
	bus.on('card-did-enter:design-block', function(card) {
		logger('system').log('card-did-enter:design-block')
	}.bind(this))
	
	bus.on('card-will-exit:design-block', function(card) {
		logger('system').log('card-will-exit:design-block')
	}.bind(this))
	
	bus.on('card-did-exit:design-block', function(card) {
		logger('system').log('card-did-exit:design-block')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'card-design-block', 'Card: Design Block')
}
