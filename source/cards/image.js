
import { Bus } from '../bus.js'
import { load_resources as load_resources_, inject_stylesheet } from '../basics.js'
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.emit('feature-will-enable', 'card-image')
	
	load_resources(function() {
		
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
	})
}

function load_resources(then) {
	
	load_resources_(function(bus) {
		inject_stylesheet(bus, `<link rel="stylesheet" type="text/css" href="./source/cards/image.css"/>`)
	}, then)
}
