
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

// e.g. design blocks

export function initialize_designed_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-designed">Card: Designed</button>`)
	
	bus.on('action-requested.card-designed', function() {
		insert_card(editor, `
			<div class="card" data-card-type="designed">Hello</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:designed', function(card) {
		logger('application').log('card-will-enter:designed')
		u(card).text('Designed Card')
	}.bind(this))
	
	bus.on('card-did-enter:designed', function(card) {
		logger('application').log('card-did-enter:designed')
		window.setTimeout(function() {
			u(card).text('Designed Card !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('card-will-exit:designed', function(card) {
		logger('application').log('card-will-exit:designed')
	}.bind(this))
	
	bus.on('card-did-exit:designed', function(card) {
		logger('application').log('card-did-exit:designed')
	}.bind(this))
}
