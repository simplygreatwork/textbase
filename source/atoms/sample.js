
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_sample_atoms(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="atom-sample">Atom: Sample</button>`)
	
	bus.on('action-requested:atom-sample', function() {
		insert_atom(editor, `
			<span class="atom" data-atom-type="sample">Atom</span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:sample', function(atom) {
		logger('application').log('atom-will-enter:sample')
		u(atom).text('Sample Atom')
	}.bind(this))
	
	bus.on('atom-did-enter:sample', function(atom) {
		logger('application').log('atom-did-enter:sample')
		window.setTimeout(function() {
			u(atom).text('Sample Atom !!!')
		}, 1000)
	}.bind(this))
	
	bus.on('atom-will-exit:sample', function(atom) {
		logger('application').log('atom-will-exit:sample')
	}.bind(this))
	
	bus.on('atom-did-exit:sample', function(atom) {
		logger('application').log('atom-did-exit:sample')
	}.bind(this))
}
