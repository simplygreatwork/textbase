
import { insert_card } from '../features/cards.js'
import { find_card_container } from '../features/cards.js'
import { is_selection_inside_card_content } from '../features/cards.js'
import { get_selection } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-code">Card: Code</button>`)
	
	bus.on('request:card-code', function() {
		insert_card(editor, 'code', `
			<div contentEditable="true" class="code-card">
				<pre>let editable = true</pre>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:code', function(card) {
		return
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
	
	disable_default_input_behavior('request-insert-character', bus, editor)
	disable_default_input_behavior('request-split-content', bus, editor)
	disable_default_input_behavior('request-delete', bus, editor)
	disable_default_input_behavior('request-select-all', bus, editor)
	disable_default_input_behavior('request-caret-right', bus, editor)
	disable_default_input_behavior('request-caret-left', bus, editor)
}

function disable_default_input_behavior(key, bus, editor) {
	
	bus.unshift(key, function(event, interrupt) {
		if (! is_code_card(editor)) return
		if (! is_selection_inside_card_content(get_selection(editor))) return 
		interrupt()
	})
}

function is_code_card(editor) {
	
	let selection = get_selection(editor)
	let container = find_card_container(selection)
	let type = u(container).data('card-type')
	return type == 'code'
}
