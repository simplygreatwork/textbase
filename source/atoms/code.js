
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_atoms(bus, editor, history) {
	
	bus.on('action:atom-code', function() {
		insert_atom(editor, create_atom(get_selected_content(editor)))
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
	
	bus.on('convert', function(data) {
		let node = u(data.node)
		if (! node.is('code')) return
		let content = document.createDocumentFragment()
		node.children().each(function(each) {
			content.appendChild(each)
		})
		data.node = create_atom(content)
	})
	
	bus.emit('feature-did-enable', 'atom-code', 'Atom: Code')
}

function create_atom(content) {																		// use <slot> inline elemment?
	
	if (u(content).text().length === 0) content = 'code'
	let node = u(`
		<span data-atom-type="code" class="atom-code" contentEditable="false">
			<code data-role="content" contentEditable=true></code>
		</span>
	`)
	node.find('[data-role="content"]').append(content)
	return node.first()
}
