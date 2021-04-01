
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_editable_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-editable">Card: Editable</button>`)
	
	bus.on('action-requested:card-editable', function() {
		insert_card(editor, `
			<div class="card" data-card-type="editable">
				<div>card's non-editable text</div>
				<div contentEditable=true><span>card's editable text</span></div>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:editable', function(card) {
		logger('system').log('card-will-enter:editable')
	}.bind(this))
	
	bus.on('card-did-enter:editable', function(card) {
		logger('system').log('card-did-enter:editable')
	}.bind(this))
	
	bus.on('card-will-exit:editable', function(card) {
		logger('system').log('card-will-exit:editable')
	}.bind(this))
	
	bus.on('card-did-exit:editable', function(card) {
		logger('system').log('card-did-exit:editable')
	}.bind(this))
}
