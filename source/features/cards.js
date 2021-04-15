
import { an_inline_element, a_block_element, find_previous_block, find_previous_element } from '../basics.js'
import { a_text_node, an_element_node, element_iterator, text_iterator } from '../basics.js'
import { zero_width_whitespace } from '../basics.js'
import { find_previous_editable_text_node } from '../basics.js'
import { consume_event } from '../basics.js'
import { get_selection, set_caret } from '../selection.js'
import { is_atom } from './atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_cards(bus, editor, history) {
	
	bus.on('document-will-install', function(document_) {
		let content = u(`<div>${document_.content}</div>`)
		content.find('[data-card-type]').each(function(card) {
			hydrate(card)
		})
		document_.content = content.first().innerHTML
	}.bind(this))
	
	bus.on('document-did-install', function(document_) {
		each_card(editor.element, editor.element, null, function(card, type) {
			bus.emit('card-will-enter', card, type)
			bus.emit('card-did-enter', card, type)
		})
	}.bind(this))
	
	bus.on('document-did-uninstall', function(document_) {
		each_card(editor.element, editor.element, null, function(card, type) {
			bus.emit('card-will-exit', card, type)
			bus.emit('card-did-exit', card, type)
		})
	})
	
	bus.on('document-will-serialize', function(document_) {
		u(document_).find('[data-card-type]').each(function(container) {
			dehydrate(container)
		})
	})
	
	bus.on('document-did-unserialize', function(document_) {
		u(document_).find('[data-card-type]').each(function(container) {
			hydrate(container)
		})
	})
	
	bus.unshift('action:insert-character', function(event, interrupt) {
		let selection = get_selection(editor)
		if (is_selection_inside_card_container_caret(selection)) {
			consume_event(event)
			interrupt()
		}
	}.bind(this))
	
	bus.unshift('action:split-content', function(event, interrupt) {
		let selection = get_selection(editor)
		if (is_selection_inside_card_container_caret(selection)) {
			let container = find_card_container(selection.head.container)
			insert_paragraph_after_card_container(container, editor)
			consume_event(event)
			interrupt()
		} else if (is_card(selection.head.container) || is_card(selection.tail.container)) {
			consume_event(event)
			interrupt()
		}
	}.bind(this))
	
	bus.unshift('action:delete', function(event, interrupt) {
		let selection = get_selection(editor)
		if (can_delete_card(editor, selection)) {
			delete_card(editor, selection, history)
			consume_event(event)
			interrupt()
		}
	})
	
	bus.on('content-will-insert', function(node, bus) {
		each_card(node, node, node, function(card, type) {
			bus.emit('card-will-enter', card, type)
		})
	})
	
	bus.on('content-did-insert', function(node, bus) {
		each_card(node, node, node, function(card, type) {
			bus.emit('card-did-enter', card, type)
		})
	})
	
	bus.on('content-will-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(container) {
			let card = u(container).children(':first-child').children(':first-child').first()
			let type = u(container).data('card-type')
			bus.emit('card-will-exit', card, type)
		})
	})
	
	bus.on('content-did-delete', function(fragment) {
		u(fragment).find('[data-card-type]').each(function(container) {
			let card = u(container).children(':first-child').children(':first-child').first()
			let type = u(container).data('card-type')
			bus.emit('card-will-exit', card, type)
		})
	})
	
	bus.on('card-will-enter', function(card, type) {
		bus.emit(`card-will-enter:${type}`, card)
	})
	
	bus.on('card-did-enter', function(card, type) {
		bus.emit(`card-did-enter:${type}`, card)
	})
	
	bus.on('card-will-exit', function(card, type) {
		bus.emit(`card-will-exit:${type}`, card)
	})
	
	bus.on('card-did-exit', function(card, type) {
		bus.emit(`card-did-exit:${type}`, card)
	})
	
	bus.on('history-will-undo', function(added, removed) {
		batch_emit('card-will-enter', added, bus)
		batch_emit('card-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed) {
		batch_emit('card-did-enter', added, bus)
		batch_emit('card-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-will-redo', function(added, removed) {
		batch_emit('card-will-enter', added, bus)
		batch_emit('card-will-exit', removed, bus)
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed) {
		batch_emit('card-did-enter', added, bus)
		batch_emit('card-did-exit', removed, bus)
	}.bind(this))
	
	bus.on('card-did-enter', function(card) {
		history.capture()
	})
	
	bus.on('card-did-exit', function(card) {
		history.capture()
	})
	
	bus.on('card-did-enter', function(container) {
		enable_resize_observer(container)
	})

	bus.on('card-will-exit', function(container) {
		disable_resize_observer(container)
	})
}

export function can_insert_card(editor) {
	
	let selection = get_selection(editor)
	if (is_selection_inside_card_container_caret(selection)) return true
	if (is_atom(selection.head.container) && is_atom(selection.tail.container)) return false		// fixme: dependency
	if (is_card(selection.head.container) && is_card(selection.tail.container)) return false
	return true
}

export function insert_card(editor, type, string) {
	
	logger('trace').log('insert_card')
	if (! can_insert_card(editor)) return 
	let selection = get_selection(editor)
	let sibling = null
	if (is_selection_inside_card_container_caret(selection)) {
		sibling = find_card_container(selection.head.container)
	} else {
		sibling = editor.split_content(a_block_element)[0]
	}
	let card = u(string)
	let container = create_container(card, type)
	card = card.first()
	editor.emit(`card-will-enter`, card, type)
	selection = get_selection(editor)
	u(sibling).after(container)
	container = container.first()
	editor.emit(`card-did-enter`, card, type)
	editor.emit('content-did-change', container, container)
}

export function create_container(card, type) {
	
	let container = u(`
		<div>
			<div class="card-content"></div>
			<div class="card-caret"><span contenteditable="true"><span>&#x200B;</span></span></div>
		</div>
	`)
	container.data('card-type', type)
	container.attr('contenteditable', 'false')
	container.addClass('card-container')
	container.addClass('flex-container')
	container.children(':first-child').append(card)
	return container
}

export function can_delete_card(editor, selection) {
	
	logger('trace').log('can_delete_card')
	if (! selection.range.collapsed) return false
	if (is_selection_inside_card_container_caret(selection)) return find_card_container(selection.head.container)
	if (selection.head.offset > 0) return false
	let element = find_previous_element(editor.element, selection.head.container)
	if (! element) return false
	if (u(element).is(an_inline_element)) return false
	let block = find_previous_block(editor.element, selection.head.container)
	if (! block) return false
	let container = u(block).closest('[data-card-type]').first()
	if (container) return container
	else return false
}

export function delete_card(editor, selection, history) {
	
	logger('trace').log('delete_card')
	let container = can_delete_card(editor, selection)
	if (container) {
		let card = u(container).children(':first-child').children(':first-child').first()
		let type = u(container).data('card-type')
		editor.emit(`card-will-exit`, card, type)
		let selectable = find_previous_editable_text_node(editor, container)
		u(container).remove()
		if (selectable) set_caret(editor, { container: selectable, offset: selectable.nodeValue.length})
		editor.emit(`card-did-exit`, card, type)
		editor.emit('content-did-change', selection.head.container, selection.tail.container)
	}
}

function batch_emit(key, nodes, bus) {
	
	nodes.forEach(function(node) {
		each_card(node, node, null, function(card, type) {
			bus.emit(key, card, type)
		})
	})
}

export function each_card(top, begin, end, fn) {
	
	let node = begin
	let iterator = element_iterator(top, begin)
	while (node) {
		let node_ = u(node)
		if (node_.is(an_element_node)) {
			if (node_.is('[data-card-type]')) {
				let card = u(node_).children(':first-child').children(':first-child').first()
				let type = u(node_).data('card-type')
				fn(card, type)
			}
		}
		if (node == end) break
		node = iterator.nextNode()
	}
}

export function is_card(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is(u('[data-card-type]'))) return true
	if (node.closest(u('[data-card-type]')).first()) return true
	return false
}

export function find_card_container(node, type) {
	
	let result = null
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.is('[data-card-type]')) {
		result = node
	} else {
		let closest = node.closest('[data-card-type]')
		if (closest) result = closest
	}
	if (type !== undefined) {
		if (result.data('card-type') != type) result = null
	}
	return result ? result.first() : null
}

export function is_selection_inside_card_container_caret(selection) {
	
	if (! selection.range.collapsed) return false
	let node = u(selection.head.container)
	if (node.is(a_text_node)) node = node.parent()
	if (node.closest(u('.card-caret')).first()) return true
	return false
}

export function is_selection_inside_card_content(selection) {
	
	return (is_card(selection.head.container) && (! is_selection_inside_card_container_caret(selection))) 
}

function insert_paragraph_after_card_container(node, editor) {
	
	let paragraph = u(`<p><span>${zero_width_whitespace}</span></p>`)
	u(node).after(paragraph)
	set_caret(editor, { container: paragraph.children(':first-child').first(), offset: 0 })
	paragraph = paragraph.first()
	editor.emit('content-did-change', paragraph, paragraph)
}

function enable_resize_observer(card) {
	
	let container = u(card).closest('[data-card-type]').first()
	container.observer_ = new ResizeObserver(function(entries) {
		let height = container.clientHeight - 50
		if (height > 200) height = 200
		u(container).find('.card-caret').first().style.fontSize = `${height}px`			// revisit: defensively debounce
	})
	container.observer_.observe(container)
}

function disable_resize_observer(card) {
	
	let container = u(card).closest('[data-card-type]').first()
	if (! container.observer_) return
	container.observer_.unobserve(container)
	container.observer_ = null
}

function hydrate(card) {
	
	card = u(card)
	let type = card.data('card-type')
	card.first().removeAttribute('data-card-type')
	let container = create_container(card.clone(), type)
	card.after(container)
	card.remove()
}

function dehydrate(container) {
	
	container = u(container)
	let type = container.data('card-type')
	let card = container.find('.card-content').clone()
	card = u(card.html())
	card.data('card-type', type)
	container.after(card)
	container.remove()
}
