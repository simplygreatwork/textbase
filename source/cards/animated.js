
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('action:card-animated', function() {
		insert_card(editor, 'animated', `
			<div class="card"></div>
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
	
	bus.emit('feature-did-enable', 'card-animated', 'Card: Animated')
}
