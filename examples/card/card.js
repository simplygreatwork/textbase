
import { insert_card } from '../../source/features/cards.js'
import { Logger } from '../../source/logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('action:card-example', function() {
		insert_card(editor, 'example', `
			<div class="card">Example</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:example', function(card) {
		logger('system').log('card-will-enter:example')
		u(card).text('Example Card')
	}.bind(this))
	
	bus.on('card-did-enter:example', function(card) {
		logger('system').log('card-did-enter:example')
		window.setTimeout(function() {
			u(card).text('Example Card !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('card-will-exit:example', function(card) {
		logger('system').log('card-will-exit:example')
	}.bind(this))
	
	bus.on('card-did-exit:example', function(card) {
		logger('system').log('card-did-exit:example')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'card-example', 'Card: Example')
}
