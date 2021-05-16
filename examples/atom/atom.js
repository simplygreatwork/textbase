
import { insert_atom } from '../../source/features/atoms.js'
import { Logger } from '../../source/logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('action:atom-example', function() {
		insert_atom(editor, `
			<span class="atom" data-atom-type="example">Atom</span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:example', function(atom) {
		logger('system').log('atom-will-enter:example')
		u(atom).text('Example Atom')
	}.bind(this))
	
	bus.on('atom-did-enter:example', function(atom) {
		logger('system').log('atom-did-enter:example')
		window.setTimeout(function() {
			u(atom).text('Example Atom !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('atom-will-exit:example', function(atom) {
		logger('system').log('atom-will-exit:example')
	}.bind(this))
	
	bus.on('atom-did-exit:example', function(atom) {
		logger('system').log('atom-did-exit:example')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-example', 'Atom: Example')
}
