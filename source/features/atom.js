
import { get_selection } from '../selection.js'
import { an_element_node, element_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function can_insert_atom(editor) {
	return true
}

export function insert_atom(editor, atom) {
	
	logger('trace').log('insert_atom')
	let node = u(atom)
	node.attr('contenteditable', 'false')
	node.attr('id', node.attr('id') || Math.random())
	let type = node.attr('data-atom-type')
	editor.emit(`atom-will-enter:${type}`, node)
	let selection = get_selection(editor)
	selection.range.insertNode(node.first())
	editor.emit(`atom-did-enter:${type}`, node)
}

export function can_delete_atom(editor, selection) {
	
	if (selection.head.offset > 0) return false
	var iterator = element_iterator(editor.element, selection.head.container)
	let previous = iterator.previousNode()
	return u(previous).hasClass('atom') ? true : false
}

export function delete_atom(editor, selection) {
	
	var iterator = element_iterator(editor.element, selection.head.container)
	let previous = iterator.previousNode()
	if (u(previous).hasClass('atom')) {
		u(previous).remove()
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
