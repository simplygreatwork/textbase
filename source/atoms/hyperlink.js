
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_hyperlink_atoms(bus, editor, history) {
	
	bus.on('action:atom-hyperlink', function() {
		insert_atom(editor, u(`
			<a data-atom-type="hyperlink" class="atom-hyperlink" href="http://github.com">
				<span data-role="content" contentEditable=true></span>
			</a>
		`).find('[data-role="content"]').append(get_selected_content(editor)).parent().first())
	}.bind(this))
	
	bus.on('atom-will-enter:hyperlink', function(atom) {
		logger('system').log('atom-will-enter:hyperlink')
	}.bind(this))
	
	bus.on('atom-did-enter:hyperlink', function(atom) {
		logger('system').log('atom-did-enter:hyperlink')
	}.bind(this))
	
	bus.on('atom-will-exit:hyperlink', function(atom) {
		logger('system').log('atom-will-exit:hyperlink')
	}.bind(this))
	
	bus.on('atom-did-exit:hyperlink', function(atom) {
		logger('system').log('atom-did-exit:hyperlink')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-hyperlink', 'Atom: Hyperlink')
}
