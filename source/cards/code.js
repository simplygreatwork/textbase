
import { insert_card } from '../features/cards.js'
import { find_card_container } from '../features/cards.js'
import { get_selection } from '../selection.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_code_cards(bus, editor, toolbar) {
	
	toolbar.append(`<button data-action="card-code">Card: Code</button>`)
	
	bus.on('action-requested:card-code', function() {
		insert_card(editor, 'code', `
			<div contentEditable="true" class="code-card">
<pre>
let editable = true
</pre>
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
	
	bus.unshift('insert-character-requested', function(event) {
		if (! is_code_card(editor)) return
		if (event && event.consumed) return
		if (event) event.consumed = true
	})
	
	bus.unshift('split-content-requested', function(event) {
		if (! is_code_card(editor)) return
		if (event && event.consumed) return
		if (event) event.consumed = true
	})
	
	bus.unshift('delete-requested', function(event) {
		if (! is_code_card(editor)) return
		if (event && event.consumed) return
		if (event) event.consumed = true
	})
}

function is_code_card(editor) {
	
	let selection = get_selection(editor)
	let container = find_card_container(selection)
	let type = u(container).data('card-type')
	return type == 'code'
}
