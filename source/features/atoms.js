
import { get_selection, selection_edge } from '../selection.js'
import { a_text_node, an_element_node, element_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_atoms(bus, editor) {
	
	bus.on('document-did-install', function(document_) {
		activate_atoms(bus, editor)
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		deactivate_atoms(bus, editor)
	})
	
	bus.unshift('delete-requested', function(event) {
		if (event.consumed) return
		let selection = get_selection(editor)
		if (selection.range.collapsed) {
			if (can_delete_atom(editor, selection)) {
				delete_atom(editor, selection)
				event.consumed = true
			}
		}
	})
	
	bus.on('content-will-delete', function(fragment) {
		u(fragment).find('[data-atom-type]').each(function(each) {
			bus.emit('atom-will-exit', each)
		})
	})
	
	bus.on('content-did-delete', function(fragment) {
		u(fragment).find('[data-atom-type]').each(function(each) {
			bus.emit('atom-did-exit', each)
		})
	})
	
	bus.on('atom-will-enter', function(atom) {
		let type = u(atom).data('atom-type')
		bus.emit(`atom-will-enter:${type}`, atom)
	})
	
	bus.on('atom-did-enter', function(atom) {
		let type = u(atom).data('atom-type')
		bus.emit(`atom-did-enter:${type}`, atom)
	})
	
	bus.on('atom-will-exit', function(atom) {
		let type = u(atom).data('atom-type')
		bus.emit(`atom-will-exit:${type}`, atom)
	})
	
	bus.on('atom-did-exit', function(atom) {
		let type = u(atom).data('atom-type')
		bus.emit(`atom-did-exit:${type}`, atom)
	})
	
	bus.on('history-will-undo', function(added, removed) {
		watch_atoms_will_enter(added, bus)
		watch_atoms_will_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed) {
		watch_atoms_did_enter(added, bus)
		watch_atoms_did_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-will-redo', function(added, removed) {
		watch_atoms_will_enter(added, bus)
		watch_atoms_will_exit(removed, bus)
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed) {
		watch_atoms_did_enter(added, bus)
		watch_atoms_did_exit(removed, bus)
	}.bind(this))
}

export function is_atom(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-atom-type]'))) return true
	if (node.closest(u('[data-atom-type]')).first()) return true
	return false
}

export function activate_atoms(bus, editor) {
	
	u(editor.element).find('[data-atom-type]').each(function(atom) {
		bus.emit('atom-will-enter', atom)
		bus.emit('atom-did-enter', atom)
	})
}

export function deactivate_atoms(bus, editor) {
	
	u(editor.element).find('[data-atom-type]').each(function(atom) {
		bus.emit('atom-will-exit', atom)
		bus.emit('atom-did-exit', atom)
	})
}

export function can_insert_atom(editor) {
	return true
}

export function insert_atom(editor, string) {
	
	logger('trace').log('insert_atom')
	let atom = u(string)
	atom.attr('contenteditable', 'false')
	editor.emit(`atom-will-enter`, atom.first())
	let selection = get_selection(editor)
	let edges = selection_edge(editor, selection)
	u(edges[1]).after(atom)
	atom = atom.first()
	editor.emit(`atom-did-enter`, atom)
	editor.emit('content-did-change', edges[1], edges[0])
}

export function can_delete_atom(editor, selection) {
	
	logger('trace').log('can_delete_atom')
	if (selection.head.offset > 0) return false
	let element = u(selection.head.container).parent().first()
	let iterator = element_iterator(editor.element, element)
	let previous = iterator.previousNode()
	let atom = u(previous).closest('[data-atom-type]').first()
	if (atom) return atom
	else return false
}

export function delete_atom(editor, selection) {
	
	logger('trace').log('delete_atom')
	let atom = can_delete_atom(editor, selection)
	if (atom) {
		editor.emit(`atom-will-exit`, atom)
		u(atom).remove()
		editor.emit(`atom-did-exit`, atom)
		editor.emit('content-did-change', selection.head.container, selection.tail.container)
	}
}

export function watch_atoms_will_enter(nodes, bus) {
	
	logger('trace').log('watch_atoms_will_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('[data-atom-type]')) {
			bus.emit('atom-will-enter', node)
		}
	})
}

export function watch_atoms_did_enter(nodes, bus) {
	
	logger('trace').log('watch_atoms_did_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('[data-atom-type]')) {
			bus.emit('atom-did-enter', node)
		}
	})
}

export function watch_atoms_will_exit(nodes, bus) {
	
	logger('trace').log('watch_atoms_will_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('[data-atom-type]')) {
			bus.emit('atom-will-exit', node)
		}
	})
}


export function watch_atoms_did_exit(nodes, bus) {
	
	logger('trace').log('watch_atoms_did_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('[data-atom-type]')) {
			bus.emit('atom-did-exit', node)
		}
	})
}
