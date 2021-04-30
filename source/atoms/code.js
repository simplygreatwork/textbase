
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_atoms(bus, editor, history) {
	
	bus.on('action:atom-code', function() {
		let content = get_selected_content(editor)
		if (u(content).text().length === 0) content = 'code'
		insert_atom(editor, u(`
			<span data-atom-type="code" class="atom-code">
				<span data-role="content" contentEditable=true></span>
			</span>
		`).find('[data-role="content"]').append(content).parent().first())
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
