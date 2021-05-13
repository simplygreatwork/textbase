
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(system) {
	
	let [ bus, editor, history ] = [ system.bus, system.editor, system.history ]
	
	bus.on('action:atom-mention', function() {
		let content = get_selected_content(editor)
		if (u(content).text().length === 0) content = 'mention'
		insert_atom(editor, u(`
			<span data-atom-type="mention" class="atom">
				<span>@</span>
				<span data-role="content" contentEditable=true></span>
			</span>
		`).find('[data-role="content"]').append(content).parent().first())
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
