
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_animated_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-animated">Card: Animated</button>`)
	
	bus.on('action-requested.card-animated', function() {
		insert_card(editor, `
			<div class="card" data-card-type="animated"></div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:animated', function(card) {
		return
	}.bind(this))
	
	bus.on('card-did-enter:animated', function(card) {
		if (card.id_) window.clearInterval(card.id_)
		card.id_ = window.setInterval(function() {
			u(card).text('Animated Card: ' + Math.random())
		}, 500)
	}.bind(this))
	
	bus.on('card-will-exit:animated', function(card) {
		window.clearInterval(card.id_)
	}.bind(this))
	
	bus.on('card-did-exit:animated', function(card) {
		return
	}.bind(this))
}
