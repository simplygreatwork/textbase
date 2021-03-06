
import { get_selection, set_caret, selection_edge } from '../selection.js'
import { a_text_node, an_element_node, element_iterator } from '../basics.js'
import { find_previous_editable_text_node } from '../basics.js'
import { consume_event } from '../basics.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('document-did-install', function(document_) {
		each_atom(editor.element, editor.element, null, function(atom) {
			bus.emit('atom-will-enter', atom)
			bus.emit('atom-did-enter', atom)
		})
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		each_atom(editor.element, editor.element, null, function(atom) {
			bus.emit('atom-will-exit', atom)
			bus.emit('atom-did-exit', atom)
		})
	})
	
	bus.on('selection-did-change', function(event, editor) {
		let selection = get_selection(editor)
		if (is_node_atom_descendant(selection.head.container) && is_node_atom_descendant(selection.tail.container)) bus.contexts.add('atom')
		else bus.contexts.delete('atom')
	}.bind(this))
	
	let context = bus.context('atom')
	context.unshift('action:split-content', function(event, interrupt) {
		consume_event(event)
		interrupt()
	}.bind(this))
	
	bus.unshift('action:delete', function(event, interrupt) {
		let selection = get_selection(editor)
		if (selection.range.collapsed) {
			if (can_delete_atom(editor, selection)) {
				delete_atom(editor, selection, history)
				consume_event(event)
				interrupt()
			}
		}
	})
	
	bus.on('content-will-insert', function(node, bus) {
		each_atom(node, node, null, function(atom) {
			bus.emit('atom-will-enter', atom)
		})
	})
	
	bus.on('content-did-insert', function(node, bus) {
		each_atom(node, node, null, function(atom) {
			bus.emit('atom-did-enter', atom)
		})
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
	
	bus.on('history-will-undo', function(added, removed) {
		emit_many('atom-will-enter', added, bus)
		emit_many('atom-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed) {
		emit_many('atom-did-enter', added, bus)
		emit_many('atom-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-will-redo', function(added, removed) {
		emit_many('atom-will-enter', added, bus)
		emit_many('atom-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed) {
		emit_many('atom-did-enter', added, bus)
		emit_many('atom-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('atom-did-enter', function(atom) {
		history.capture()
	})
	
	bus.on('atom-did-exit', function(atom) {
		history.capture()
	})
	
	bus.on('atom-will-enter', function(atom) {
		bus.emit(`atom-will-enter:${u(atom).data('atom-type')}`, atom)
	})
	
	bus.on('atom-did-enter', function(atom) {
		bus.emit(`atom-did-enter:${u(atom).data('atom-type')}`, atom)
	})
	
	bus.on('atom-will-exit', function(atom) {
		bus.emit(`atom-will-exit:${u(atom).data('atom-type')}`, atom)
	})
	
	bus.on('atom-did-exit', function(atom) {
		bus.emit(`atom-did-exit:${u(atom).data('atom-type')}`, atom)
	})
}

export function is_node_atom_descendant(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-atom-type]'))) return true
	if (node.closest(u('[data-atom-type]')).first()) return true
	return false
}

export function can_insert_atom(editor) {
	
	let selection = get_selection(editor)
	if (is_node_atom_descendant(selection.head.container) && is_node_atom_descendant(selection.tail.container)) return false
	return true
}

export function insert_atom(editor, node) {
	
	logger('trace').log('insert_atom')
	if (! can_insert_atom(editor)) return 
	let selection = get_selection(editor)
	if (! selection.range.collapsed) {
		editor.request_to_delete()
		selection = get_selection(editor)
	}
	let atom = u(node)
	atom.attr('contenteditable', 'false')
	editor.emit(`atom-will-enter`, atom.first())
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

export function delete_atom(editor, selection, history) {
	
	logger('trace').log('delete_atom')
	let atom = can_delete_atom(editor, selection)
	if (atom) {
		editor.emit(`atom-will-exit`, atom)
		let selectable = find_previous_editable_text_node(editor, atom)
		u(atom).remove()
		if (selectable) set_caret(editor, { container: selectable, offset: selectable.nodeValue.length})
		editor.emit(`atom-did-exit`, atom)
		editor.emit('content-did-change', selection.head.container, selection.tail.container)
	}
}

function emit_many(key, nodes, bus) {
	
	nodes.forEach(function(node) {
		each_atom(node, node, null, function(atom) {
			bus.emit(key, atom)
		})
	})
}

function each_atom(top, begin, end, fn) {
	
	let node = begin
	let iterator = element_iterator(top, begin)
	while (node) {
		let node_ = u(node)
		if (node_.is(an_element_node)) {
			if (node_.is('[data-atom-type]')) {
				fn(node_.first())
			}
		}
		if (node == end) break
		node = iterator.nextNode()
	}
}

export function is_selection_inside_atom_content(selection, type) {
	
	let node = u(selection.head.container)
	if (node.is(a_text_node)) node = node.parent()
	if (type) return u(node).closest(`[data-atom-type="${type}"]`).first()
	else return u(node).closest(`[data-atom-type]`).first()
}

export function set_value(atom, key, value) {
	
	atom.data = atom.data || {}
	atom.data[key] = value
	return value
}

export function get_value(atom, key) {
	
	atom.data = atom.data || {}
	return atom.data[key]
}
