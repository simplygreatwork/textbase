
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_atoms(bus, editor, history) {
	
	bus.on('action:atom-code', function() {
		insert_atom(editor, `
			<span class="atom-code" data-atom-type="code">
				<span contentEditable=true>Code</span>
			</span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:code', function(atom) {
		logger('system').log('atom-will-enter:code')
	}.bind(this))
	
	bus.on('atom-did-enter:code', function(atom) {
		logger('system').log('atom-did-enter:code')
	}.bind(this))
	
	bus.on('atom-will-exit:code', function(atom) {
		logger('system').log('atom-will-exit:code')
	}.bind(this))
	
	bus.on('atom-did-exit:code', function(atom) {
		logger('system').log('atom-did-exit:code')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-code', 'Atom: Code')
}
