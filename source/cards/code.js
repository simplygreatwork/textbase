
import { Bus } from '../bus.js'
import { a_text_node } from '../basics.js'
import { consume_event, get_clipboard_data, decode_entities } from '../basics.js'
import { load_resources as load_resources_, inject_stylesheet, inject_script } from '../basics.js'
import { get_selection, with_selection, with_content_selection } from '../selection.js'
import { set_selection, select_range } from '../selection.js'
import { insert_card } from '../features/cards.js'
import { each_card } from '../features/cards.js'
import { find_card_container } from '../features/cards.js'
import { is_selection_inside_card_container_content } from '../features/cards.js'
import { get_placeholder_code } from './code-support.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.emit('feature-will-enable', 'card-code')
	
	load_resources(function() {
		
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
			let content = u(container).find('.code-source code').first()
			select_range(editor, content, content)
			consume_event(event)
			interrupt()
		})
		
		context.unshift('action:indent', function(event, interrupt) {
			let selection = get_selection(editor)
			if (selection.range.collapsed) {
				editor.insert_string('\t')
			} else {
				indent_lines(editor, history)
			}
			consume_event(event)
			interrupt()
		})
		
		context.unshift('action:dedent', function(event, interrupt) {
			dedent_lines(editor, history)
			consume_event(event)
			interrupt()
		})
		
		disable_default_input_behavior(context, 'action:caret-right',)
		disable_default_input_behavior(context, 'action:caret-left')
		
		context.on('content-did-change', function(head, tail) {
			render(find_card_container(head, 'code'))
		}.bind(this))
		
		context.on('history-did-undo', mutated)
		context.on('history-did-redo', mutated)
		
		context.on('clipboard-cut', function(event, interrupt) {
			with_content_selection(editor, function(selection) {
				let data = get_clipboard_data(event)
				data.setData('text/plain', u(selection.range.extractContents()).text())
				render(find_card_container(selection.head.container, 'code'))
				consume_event(event)
				interrupt()
			})
		}.bind(this))
		
		context.on('clipboard-copy', function(event, interrupt) {
			with_content_selection(editor, function(selection) {
				let data = get_clipboard_data(event)
				data.setData('text/plain', u(selection.range.cloneContents()).text())
				consume_event(event)
				interrupt()
			})
		}.bind(this))
		
		context.unshift('clipboard-paste', function(event, interrupt) {
			with_selection(editor, function(selection) {
				let data = get_clipboard_data(event)
				let content = data.getData('text/plain')
				editor.insert_string(content)
				render(find_card_container(selection.head.container, 'code'))
				consume_event(event)
				interrupt()
			})
		})
		
		bus.emit('feature-did-enable', 'card-code', 'Card: Code')
	})
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
		let text = content.text()
		let html = Prism.highlight(text, Prism.languages.javascript, 'javascript')
		container.find('.code-highlighted code').html(html)
	}
}

function mutated(added, removed, changed) {
	
	added.forEach(function(node) {
		render(find_card_container(node, 'code'))
	})
	removed.forEach(function(node) {
		render(find_card_container(node, 'code'))
	})
	changed.forEach(function(node) {
		render(find_card_container(node, 'code'))
	})
}

function indent_lines(editor, history) {
	
	shift_selected_lines(editor, history, function(line, index, selection) {
		let result = `\t${line}`
		if (index === 0) selection.head.offset++
		selection.tail.offset++
		return result
	})
}

function dedent_lines(editor, history) {
	
	shift_selected_lines(editor, history, function(line, index, selection) {
		let result = line
		if (line.charAt(0) == '\t') {
			result = line.slice(1)
			if (index === 0) selection.head.offset--
			selection.tail.offset--
		}
		return result
	})
}

function shift_selected_lines(editor, history, fn) {
	
	let selection = get_selection(editor)
	let selection_ = get_selection(editor)
	let container = find_card_container(selection.head.container, 'code')
	let node = u(container).find('.code-source code').first().firstChild
	let begin = 0
	let index = 0
	node.nodeValue = node.nodeValue.split('\n').map(function(line) {
		let result = line
		let end = begin + line.length + 1
		if (is_line_selected(selection, begin, end)) {
			result = fn(line, index, selection_)
			index++
		}
		begin = begin + line.length + 1
		return result
	}).join('\n')
	set_selection(editor, selection_)
	history.capture()
	render(container)
}

function is_line_selected(selection, begin, end) {
	
	if (begin <= selection.head.offset && selection.head.offset < end) return true
	if (begin < selection.tail.offset && selection.tail.offset <= end) return true
	if (begin > selection.head.offset && end < selection.tail.offset) return true
	return false
}

function hydrate(card) {
	
	let source = u(card).find('.code-source code')
	source.html(source.html().trim())
	u(card).find('.code-source').after('<div class="code-highlighted"><pre><code></code></pre></div>')
}

function dehydrate(container) {
	
	let source = u(container).find('.code-source code')
	source.text(source.html())										// encode html entities
	u(container).find('.code-highlighted').remove()
}

function load_resources(then) {
	
	load_resources_(function(bus) {
		inject_stylesheet(bus, `<link rel="stylesheet" type="text/css" href="./source/cards/code.css"/>`)
		inject_stylesheet(bus, `<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/themes/prism.css"/>`)
		inject_stylesheet(bus, `<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/themes/prism-tomorrow.css"/>`)
		inject_script(bus, `<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/prism.min.js" data-manual>`)
		inject_script(bus, `<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/prismjs@1.23.0/plugins/autoloader/prism-autoloader.min.js">`)
	}, then)
}
