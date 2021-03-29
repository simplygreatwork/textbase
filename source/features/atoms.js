
import { get_selection, selection_edge } from '../selection.js'
import { a_text_node, an_element_node, element_iterator } from '../basics.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_atoms(bus, editor, history) {
	
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
	
	bus.unshift('delete-requested', function(event) {
		if (event.consumed) return
		let selection = get_selection(editor)
		if (selection.range.collapsed) {
			if (can_delete_atom(editor, selection)) {
				delete_atom(editor, selection, history)
				event.consumed = true
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

export function is_atom(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-atom-type]'))) return true
	if (node.closest(u('[data-atom-type]')).first()) return true
	return false
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

export function delete_atom(editor, selection, history) {
	
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
	
	nodes.forEach(function(node) {
		each_atom(node, node, null, function(card) {
			bus.emit('atom-will-enter', card)
		})
	})
}

export function watch_atoms_did_enter(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_atom(node, node, null, function(card) {
			bus.emit('atom-did-enter', card)
		})
	})
}

export function watch_atoms_will_exit(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_atom(node, node, null, function(card) {
			bus.emit('atom-will-exit', card)
		})
	})
}

export function watch_atoms_did_exit(nodes, bus) {
	
	nodes.forEach(function(node) {
		each_atom(node, node, null, function(card) {
			bus.emit('atom-did-exit', card)
		})
	})
}

export function each_atom(top, begin, end, fn) {
	
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
