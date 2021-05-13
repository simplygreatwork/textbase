
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('action:atom-sample', function() {
		insert_atom(editor, `
			<span class="atom" data-atom-type="sample">Atom</span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:sample', function(atom) {
		logger('system').log('atom-will-enter:sample')
		u(atom).text('Sample Atom')
	}.bind(this))
	
	bus.on('atom-did-enter:sample', function(atom) {
		logger('system').log('atom-did-enter:sample')
		window.setTimeout(function() {
			u(atom).text('Sample Atom !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('atom-will-exit:sample', function(atom) {
		logger('system').log('atom-will-exit:sample')
	}.bind(this))
	
	bus.on('atom-did-exit:sample', function(atom) {
		logger('system').log('atom-did-exit:sample')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-sample', 'Atom: Sample')
}
