
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_sample_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-sample">Card: Sample</button>`)
	
	bus.on('action-requested:card-sample', function() {
		insert_card(editor, `
			<div class="card" data-card-type="sample">Hello</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:sample', function(card) {
		logger('application').log('card-will-enter:sample')
		u(card).text('Sample Card')
	}.bind(this))
	
	bus.on('card-did-enter:sample', function(card) {
		logger('application').log('card-did-enter:sample')
		window.setTimeout(function() {
			u(card).text('Sample Card !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('card-will-exit:sample', function(card) {
		logger('application').log('card-will-exit:sample')
	}.bind(this))
	
	bus.on('card-did-exit:sample', function(card) {
		logger('application').log('card-did-exit:sample')
	}.bind(this))
}
