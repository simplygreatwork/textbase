
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_mention_atoms(bus, editor, toolbar) {
	
	bus.on('action:atom-mention', function() {
		insert_atom(editor, `
			<span class="atom" data-atom-type="mention">
				<span>@</span>
				<span contentEditable=true>mention</span>
			</span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:mention', function(atom) {
		logger('system').log('atom-will-enter:mention')
	}.bind(this))
	
	bus.on('atom-did-enter:mention', function(atom) {
		logger('system').log('atom-did-enter:mention')
	}.bind(this))
	
	bus.on('atom-will-exit:mention', function(atom) {
		logger('system').log('atom-will-exit:mention')
	}.bind(this))
	
	bus.on('atom-did-exit:mention', function(atom) {
		logger('system').log('atom-did-exit:mention')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-mention', 'Atom: Mention')
}
