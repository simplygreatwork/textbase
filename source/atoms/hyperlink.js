
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_hyperlink_atoms(bus, editor, history) {
	
	bus.on('action:atom-hyperlink', function() {
		insert_atom(editor, create_atom(get_selected_content(editor), 'http://github.com'))
	})
	
	bus.on('atom-will-enter:hyperlink', function(atom) {
		logger('system').log('atom-will-enter:hyperlink')
	})
	
	bus.on('atom-did-enter:hyperlink', function(atom) {
		logger('system').log('atom-did-enter:hyperlink')
	})
	
	bus.on('atom-will-exit:hyperlink', function(atom) {
		logger('system').log('atom-will-exit:hyperlink')
	})
	
	bus.on('atom-did-exit:hyperlink', function(atom) {
		logger('system').log('atom-did-exit:hyperlink')
	})
	
	bus.on('convert', function(data) {
		let node = u(data.node)
		if (! node.is('a')) return
		let content = document.createDocumentFragment()
		node.children().each(function(each) {
			content.appendChild(each)
		})
		data.node = create_atom(content, node.attr('href'))
	})
	
	bus.emit('feature-did-enable', 'atom-hyperlink', 'Atom: Hyperlink')
}

function create_atom(content, href) {																// use <slot> inline elemment?
	
	if (u(content).text().length === 0) content = 'hyperlink'
	let node = u(`
		<a data-atom-type="hyperlink" class="atom-hyperlink" href="http://github.com" contentEditable="false">
			<span data-role="content" contentEditable="true"></span>
		</a>
	`)
	node.find('[data-role="content"]').append(content)
	node.attr('href', href)
	return node.first()
}
