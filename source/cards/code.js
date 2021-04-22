
import { a_text_node } from '../basics.js'
import { consume_event } from '../basics.js'
import { get_selection, select_range } from '../selection.js'
import { insert_card } from '../features/cards.js'
import { each_card } from '../features/cards.js'
import { find_card_container } from '../features/cards.js'
import { is_selection_inside_card_container_content } from '../features/cards.js'
import { inject_css, get_placeholder_code } from './code-support.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_cards(bus, editor, history) {
	
	if (false) inject_css()
	
	bus.on('action:card-code', function() {
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
		render(find_card_container(card, 'code'))
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
	
	bus.on('selection-did-change', function(event, editor) {
		if (is_selection_inside_card_container_content(get_selection(editor), 'code')) bus.contexts.add('card-code')
		else bus.contexts.delete('card-code')
	}.bind(this))
	
	let context = bus.context('card-code')
	context.unshift('action:insert-character', function(event, interrupt) {
		editor.insert_character(event)
		consume_event(event)
		interrupt()
	})
	
	context.unshift('keydown:space', function(event, interrupt) {
		editor.insert_character(event)
		consume_event(event)
		interrupt()
	})
	
	context.unshift('action:split-content', function(event, interrupt) {
		consume_event(event)
		interrupt()
	})
	
	context.unshift('keydown:enter', function(event, interrupt) {
		editor.insert_string('\n')
		history.capture()
		consume_event(event)
		interrupt()
	})
	
	context.unshift('action:select-all', function(event, interrupt) {
		let selection = get_selection(editor)
		let container = find_card_container(selection.head.container, 'code')
		let content = u(container).find('.code-highlighted code').first()
		select_range(editor, content, content)
		consume_event(event)
		interrupt()
	})
	
	context.unshift('action:indent', function(event, interrupt) {
		consume_event(event)
		interrupt()
	})
	
	context.unshift('action:dedent', function(event, interrupt) {
		consume_event(event)
		interrupt()
	})
	
	disable_default_input_behavior(context, 'action:caret-right',)
	disable_default_input_behavior(context, 'action:caret-left')
	
	context.on('content-did-change', function(head, tail) {
		render(find_card_container(head, 'code'))
	}.bind(this))
	
	context.on('history-did-undo', function(added, removed, changed) {
		render(find_card_container(added.concat(removed).concat(removed).slice(0, 1), 'code'))
	})
	
	context.on('history-did-redo', function(added, removed, changed) {
		render(find_card_container(added.concat(removed).concat(removed).slice(0, 1), 'code'))
	})
	
	context.on('clipboard-cut', function(event, editor, interrupt) {
		let selection = get_selection(editor)
		if (selection == null) return
		event.clipboardData.setData('text/plain', u(selection.range.cloneContents()).text())
		render(find_card_container(selection.head.container, 'code'))
		consume_event(event)
		interrupt()
	}.bind(this))
	
	context.on('clipboard-copy', function(event, editor, interrupt) {
		let selection = get_selection(editor)
		if (selection == null) return
		event.clipboardData.setData('text/plain', u(selection.range.cloneContents()).text())
		consume_event(event)
		interrupt()
	}.bind(this))
	
	context.unshift('clipboard-paste', function(event, editor, interrupt) {
		let selection = get_selection(editor)
		if (selection == null) return
		let clipboard_data = (event.clipboardData || window.clipboardData)
		let content = clipboard_data.getData('text/plain')
		editor.insert_string(content)
		render(find_card_container(selection.head.container, 'code'))
		consume_event(event)
		interrupt()
	})
	
	bus.emit('feature-did-enable', 'card-code', 'Card: Code')
}

function disable_default_input_behavior(context, key) {
	
	context.unshift(key, function(event, interrupt) {
		consume_event(event)
		interrupt()
	})
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
