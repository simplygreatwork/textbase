
import { get_selection } from '../selection.js'
import { get_selected_content } from '../selection.js'
import { insert_atom } from '../features/atoms.js'
import { is_selection_inside_atom_content } from '../features/atoms.js'
import { set_value, get_value } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(bus, editor, history) {
	
	bus.on('action:atom-hyperlink', function() {
		insert_atom(editor, create_atom(get_selected_content(editor), 'http://github.com'))
	})
	
	bus.on('atom-did-enter:hyperlink', function(atom) {
		watch(atom, true)
	})
	
	bus.on('atom-will-exit:hyperlink', function(atom) {
		watch(atom, false)
	})
	
	bus.on('selection-did-change', function(event, editor) {
		let atom = is_selection_inside_atom_content(get_selection(editor), 'hyperlink')
		set_inspector_enabled(atom)
	}.bind(this))
	
	bus.on('convert:a', function(data) {
		let content = document.createDocumentFragment()
		u(data.node).children().each(function(each) {
			content.appendChild(each)
		})
		data.node = create_atom(content, u(data.node).attr('href'))
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

function watch(atom, enabled) {
	
	if (enabled && ! get_value(atom, 'enter')) {
		u(atom).on('mouseenter', set_value(atom, 'enter', function(event) {
			console.log(`Link: ${u(atom).attr('href')}`)
		}))
		u(atom).on('mouseleave', set_value(atom, 'leave', function(event) {
			return
		}))
	} else {
		if (get_value(atom, 'enter')) u(atom).off('mouseenter', get_value(atom, 'enter'))
		if (get_value(atom, 'leave')) u(atom).off('mouseleave', get_value(atom, 'leave'))
		set_value(atom, 'enter', false)
		set_value(atom, 'leave', false)
	}
}

function set_inspector_enabled(atom) {
	
	let enabled = atom ? true : false
	let inspector = window.inspector
	if (! inspector) {
		inspector = u(`
			<div class="atom-hyperlink-inspector">
				URL<input>
			</div>
		`)
		u(inspector).find('input').on('input', function(event) {
			let value = u(inspector).find('input').first().value
			u(inspector.atom).attr('href', value)
		})
		inspector = window.inspector = inspector.first()
		u(document.body).append(inspector)
	}
	if (enabled) {
		inspector.atom = atom
		var bounds = atom.getBoundingClientRect()
		inspector.style.top = `${bounds.top + 30}px`
		inspector.style.left = `${bounds.left}px`
		inspector.style.display = 'block'
		inspector = u(inspector)
		let href = u(atom).attr('href')
		inspector.find('input').first().value = href
	} else {
		inspector.atom = null
		inspector.style.display = 'none'
	}
}
