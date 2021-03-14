
import { insert_card } from '../features/card.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function install_animated_card(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-animated">Card: Animated</button>`)
	
	bus.on('action.request.card-animated', function() {
		insert_card(editor, `
			<div class="card" data-card-type="animated"></div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:animated', function(card) {
		return
	}.bind(this))
	
	bus.on('card-did-enter:animated', function(card) {
		console.log('card-did-enter:animated')
		if (card.id) window.clearInterval(card.id)
		card.id = window.setInterval(function() {
			u(card).text('Animated Card: ' + Math.random())
			console.log('Animating card...')
		}, 500)
	}.bind(this))
	
	bus.on('card-will-exit:animated', function(card) {
		console.log('card-will-exit:animated')
		window.clearInterval(card.id)
	}.bind(this))
	
	bus.on('card-did-exit:animated', function(card) {
		return
	}.bind(this))
}
