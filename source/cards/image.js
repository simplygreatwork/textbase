
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_image_cards(bus, editor, history) {
	
	bus.on('action:card-image', function() {
		insert_card(editor, 'image', `
			<div class="image-card">
				<img src="images/cosmic.jpg">
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:image', function(card) {
		logger('system').log('card-will-enter:image')
	}.bind(this))
	
	bus.on('card-did-enter:image', function(card) {
		logger('system').log('card-did-enter:image')
	}.bind(this))
	
	bus.on('card-will-exit:image', function(card) {
		logger('system').log('card-will-exit:image')
	}.bind(this))
	
	bus.on('card-did-exit:image', function(card) {
		logger('system').log('card-did-exit:image')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'card-image', 'Card: Image')
}
