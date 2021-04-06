
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_image_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-image">Card: Image</button>`)
	
	bus.on('action-requested:card-image', function() {
		insert_card(editor, `
			<div class="image-card" data-card-type="image" style="height:200px;">
				<img style="width:100%;height:100%;object-fit:none;" src="images/cosmic.jpg"/>
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
}
