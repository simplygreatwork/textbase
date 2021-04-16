
import { a_text_node } from '../basics.js'
import { consume_event } from '../basics.js'
import { get_selection } from '../selection.js'
import { insert_card } from '../features/cards.js'
import { each_card } from '../features/cards.js'
import { find_card_container } from '../features/cards.js'
import { is_selection_inside_card_content } from '../features/cards.js'
import { inject_css, get_placeholder_code } from './code-support.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_cards(bus, editor) {
	
	bus.on('action:card-code', function() {
		
		if (false) inject_css()
		let code = get_placeholder_code()
		insert_card(editor, 'code', `
			<div class="code-card">
				<div class="code-source"><pre><code contentEditable="true">${code}</code></pre></div>
				<div class="code-highlighted"><pre><code></code></pre></div>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-deserialize:code', function(card) {
		hydrate(card)
	}.bind(this))
	
	bus.on('card-will-serialize:code', function(container) {
		dehydrate(container)
	}.bind(this))
	
	bus.on('card-will-enter:code', function(card) {
		let container = find_card_container(card, 'code')
		render(container)
	}.bind(this))
	
	bus.on('card-did-enter:code', function(card) {
		return
	}.bind(this))
	
	bus.on('card-will-exit:code', function(card) {
		return
	}.bind(this))
	
	bus.on('card-did-exit:code', function(card) {
		return
	}.bind(this))
	
	disable_default_input_behavior('action:caret-right', bus, editor)
	disable_default_input_behavior('action:caret-left', bus, editor)
	
	bus.unshift('action:insert-character', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		editor.insert_character(event)
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		bus.emit('content-did-change', container, container)
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('keydown:space', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		editor.insert_character(event)
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		bus.emit('content-did-change', container, container)
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('keydown:enter', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		editor.insert_string('\n')
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		bus.emit('content-did-change', container, container)
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('action:split-content', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('action:delete', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		editor.delete_character(get_selection(editor))
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		bus.emit('content-did-change', container, container)
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('action:select-all', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('action:indent', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		consume_event(event)
		interrupt()
	})
	
	bus.unshift('action:dedent', function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		consume_event(event)
		interrupt()
	})
	
	bus.on('content-did-change', function(head, tail) {
		render(find_card_container(head, 'code'))
	}.bind(this))
	
	bus.on('history-did-undo', function(added, removed, changed) {
		changed.forEach(function(node) {
			render(find_card_container(node, 'code'))
		})
	}.bind(this))
	
	bus.on('history-did-redo', function(added, removed, changed) {
		changed.forEach(function(node) {
			render(find_card_container(node, 'code'))
		})
	}.bind(this))
	
	bus.on('clipboard-cut', function(event, editor, interrupt) {
		let selection = get_selection(editor)
		if (selection == null) return
		event.clipboardData.setData('text/plain', u(selection.range.cloneContents()).text())
		consume_event(event)
		interrupt()
	}.bind(this))

	bus.on('clipboard-copy', function(event, editor, interrupt) {
		let selection = get_selection(editor)
		if (selection == null) return
		event.clipboardData.setData('text/plain', u(selection.range.cloneContents()).text())
		consume_event(event)
		interrupt()
	}.bind(this))
	
	bus.unshift('clipboard-paste', function(event, editor, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		let clipboard_data = (event.clipboardData || window.clipboardData)
		let content = clipboard_data.getData('text/plain')
		editor.insert_string(content)
		setTimeout(function() {
			render(container)
		})
		consume_event(event)
		interrupt()
	})
	
	bus.emit('feature-did-enable', 'card-code', 'Card: Code')
}

function disable_default_input_behavior(key, bus, editor) {
	
	bus.unshift(key, function(event, interrupt) {
		if (! is_selection_inside_code_card_content(editor)) return
		interrupt()
	})
}

function is_selection_inside_code_card_content(editor) {
	
	let result = true
	let selection = get_selection(editor)
	if (! find_card_container(selection.head.container, 'code')) result = false
	if (! is_selection_inside_card_content(selection)) result = false
	return result
}

function render(container) {
	
	if (! container) return
	container = u(container)
	let content = container.find('.code-source')
	if (content.first()) {
		let html = Prism.highlight(content.text(), Prism.languages.javascript, 'javascript')
		container.find('.code-highlighted code').html(html)
	}
}

function hydrate(card) {
	u(card).find('.code-source').after('<div class="code-highlighted"><pre><code></code></pre></div>')
}

function dehydrate(container) {
	u(container).find('.code-highlighted').remove()
}
