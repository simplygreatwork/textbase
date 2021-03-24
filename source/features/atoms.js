
import { get_selection, selection_edge } from '../selection.js'
import { an_element_node, element_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function activate_atoms(editor, bus) {
	
	u(editor.element).find('.atom').each(function(atom) {
		bus.emit('atom-will-enter', atom)
		bus.emit('atom-did-enter', atom)
	})
}

export function deactivate_atoms(editor, bus) {
	
	u(editor.element).find('.atom').each(function(atom) {
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
	editor.emit('content:did-change', edges[1], edges[0])
}

export function can_delete_atom(editor, selection) {
	
	if (selection.head.offset > 0) return false
	let iterator = element_iterator(editor.element, selection.head.container)
	let previous = iterator.previousNode()
	return u(previous).hasClass('atom') ? true : false
}

export function delete_atom(editor, selection) {
	
	let iterator = element_iterator(editor.element, selection.head.container)
	let previous = iterator.previousNode()
	if (u(previous).hasClass('atom')) {
		let atom = previous
		editor.emit(`atom-will-exit`, atom)
		u(atom).remove()
		editor.emit(`atom-did-exit`, atom)
		editor.emit('content:did-change', selection.head.container, selection.tail.container)
	}
}

export function watch_atoms_will_enter(nodes, bus) {
	
	logger('trace').log('watch_atoms_will_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.atom')) {
			bus.emit('atom-will-enter', node)
		}
	})
}

export function watch_atoms_will_exit(nodes, bus) {
	
	logger('trace').log('watch_atoms_will_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.atom')) {
			bus.emit('atom-will-exit', node)
		}
	})
}

export function watch_atoms_did_enter(nodes, bus) {
	
	logger('trace').log('watch_atoms_did_enter')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.atom')) {
			bus.emit('atom-did-enter', node)
		}
	})
}

export function watch_atoms_did_exit(nodes, bus) {
	
	logger('trace').log('watch_atoms_did_exit')
	if (! Array.isArray(nodes)) nodes = [nodes] 
	nodes.forEach(function(node) {
		if (u(node).is(an_element_node) && u(node).is('.atom')) {
			bus.emit('atom-did-exit', node)
		}
	})
}
