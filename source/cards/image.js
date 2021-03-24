
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_image_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-image">Card: Image</button>`)
	
	bus.on('action-requested.card-image', function() {
		insert_card(editor, `
			<div class="card" data-card-type="image">
				<img style="object-fit:contain;" src="https://www.philosophytalk.org/sites/default/files/styles/large_blog__900x400_/public/graham-holtshausen-fUnfEz3VLv4-unsplash.jpg">
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:image', function(card) {
		logger('application').log('card-will-enter:image')
	}.bind(this))
	
	bus.on('card-did-enter:image', function(card) {
		logger('application').log('card-did-enter:image')
	}.bind(this))
	
	bus.on('card-will-exit:image', function(card) {
		logger('application').log('card-will-exit:image')
	}.bind(this))
	
	bus.on('card-did-exit:image', function(card) {
		logger('application').log('card-did-exit:image')
	}.bind(this))
}
