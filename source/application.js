
import { Bus } from './bus.js'
import { Editor } from './editor.js'
import { History } from './history.js'
import { Toolbar } from './toolbar.js'
import { get_selection, set_selection, selection_to_string } from './selection.js'
import { caret_left, caret_right, caret_up, caret_down } from './keyboard.js'
import { toggle_format, remove_formats, find_active_formats, find_applicable_formats } from './features/formats.js'
import { toggle_block, find_active_block, find_applicable_blocks } from './features/blocks.js'
import { initialize_hyperlinks, detect_hyperlinks } from './features/hyperlink.js'
import { initialize_clipboard } from './clipboard.js'
import { insert_card } from './features/card.js'
import { insert_atom } from './features/atom.js'
import { serialize } from './serialize.js'
import { Scanner } from './scanner.js'
import { Logger } from './logger.js'

const logger = Logger(['trace-off', 'application-off', 'editor-off', 'toolbar-off', 'formats-off', 'scanner-off'])

export class Application {
	
	constructor() {
		
		this.bus = new Bus()
		this.load_document(function() {
			this.editor = new Editor({ element: document.querySelector('.editor'), bus: this.bus })
			this.toolbar = new Toolbar(this.bus)
			this.history = new History(document.querySelector('.content'), this.bus)
			this.configure(this.bus, this.editor)
			let scanner = new Scanner(this.editor)
			scanner.scan(document.querySelector('.content'))
			if (false) this.apply_selection_by_positions()
		}.bind(this))
	}
	
	load_document(fn) {
		
		fetch('./documents/all.html')
		// fetch('./documents/p.html')
		.then(response => response.text())
		.then(function(data) {
			logger('application').log('fetched: ' + data)
			u('.content').empty().append(u(data))
			this.bus.emit('document:did-load')
			fn()
		}.bind(this))
	}
	
	configure(bus, editor) {
		
		this.configure_history_selections(bus, editor)
		this.configure_basics(bus, editor)
		this.configure_formats(bus, editor)
		this.configure_blocks(bus, editor)
		this.configure_atoms(bus, editor)
		this.configure_cards(bus, editor)
		this.configure_other(bus, editor)
	}
	
	configure_history_selections(bus, editor) {
		
		let selections = []
		let selection = null
		
		bus.on('selection:did-change', function(editor) {
			if (this.history.enabled) {
				let selection = get_selection(this.editor)
				selections.push(selection)
			}
		}.bind(this))
		
		bus.on('history:did-begin-mutations', function(data) {
			if (selections.length > 0) {
				selection = selections[selections.length - 1]
				selections = []
			}
		}.bind(this))
		
		bus.on('history:did-capture', function(record) {
			record.selection.before = selection
			record.selection.after = get_selection(this.editor)
		}.bind(this))
		
		bus.on('history:did-undo', function(data) {
			let record = this.history.records[this.history.index]
			if (record && record.selection && record.selection.before) {
				set_selection(this.editor, record.selection.before)
			}
		}.bind(this))
		
		bus.on('history:did-redo', function(data) {
			let record = this.history.records[this.history.index + 1]
			if (record && record.selection && record.selection.after) {
				set_selection(this.editor, record.selection.after)
			}
		}.bind(this))
		
		this.history.enable()
		
		bus.on('editor:mousedown', function(data) {
			this.history.capture()
		}.bind(this))
		
		bus.on('keydown:arrowleft', function(event) {
			this.history.capture()
		}.bind(this))
		
		bus.on('keydown:arrowright', function(event) {
			this.history.capture()
		}.bind(this))
		
		bus.on('keydown:arrowup', function(event) {
			this.history.capture()
		}.bind(this))
		
		bus.on('keydown:arrowdown', function(event) {
			this.history.capture()
		}.bind(this))
	}
	
	configure_basics(bus, editor) {
		
		this.toolbar.append(`<button data-action="hyperlink">Link</button>`)
		this.toolbar.append(`<button data-action="image">Image</button>`)
		this.toolbar.append(`<button data-action="code">Code</button>`)
		this.toolbar.append(`<button data-action="metadata">Metadata</button>`)
		this.toolbar.append(`<button data-action="formula">Formula</button>`)
		
		bus.on('keydown:alphanumeric', function(event) {
			if (editor.can_insert_character()) {
				editor.insert_character(event.key)
				event.preventDefault()
				return false
			}
		}.bind(this))
		
		bus.on('keydown:enter', function(event) {
			editor.split_content('p,h1,h2,li')
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keydown:backspace', function(event) {
			editor.delete_()
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keyup:backspace', function(event) {
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keydown:control-z', function(event) {
			this.history.undo()
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keydown:control-shift-z', function(event) {
			this.history.redo()
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keyup:arrowright', function(event) {
			return caret_right(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowleft', function(event) {
			return caret_left(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowdown', function(event) {
			return caret_down(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowup', function(event) {
			return caret_up(event, editor)
		}.bind(this))
		
		initialize_clipboard(editor)
	}
	
	configure_formats(bus, editor) {
		
		this.toolbar.append(`<button data-action="hyperlink" data-format="hyperlink">Hyperlink</button>`)
		this.toolbar.append(`<button data-action="strong" data-format="strong">Strong</button>`)
		this.toolbar.append(`<button data-action="emphasis" data-format="emphasis">Emphasis</button>`)
		this.toolbar.append(`<button data-action="underline" data-format="underline">Underline</button>`)
		this.toolbar.append(`<button data-action="strikethrough" data-format="strikethrough">Strikethrough</button>`)
		this.toolbar.append(`<button data-action="highlight" data-format="highlight">Highlight</button>`)
		this.toolbar.append(`<button data-action="clear-formatting">Clear Formatting</button>`)
		
		initialize_hyperlinks(editor, bus)
		detect_hyperlinks(editor, bus)
		
		bus.on('action.request.hyperlink', function() {
			let result = window.prompt('Enter a URL', 'http://github.com')
			if (result) toggle_format(this.editor, 'hyperlink', { href: result })
		}.bind(this))
		
		bus.on('hyperlink:clicked', function(href, event) {
			if (event && event.ctrlKey) {
				let window_ = window.open(href)
			} else {
				window.location.href = href
			}
		}.bind(this))
		
		bus.on('action.request.strong', function() {
			toggle_format(this.editor, 'strong')
		}.bind(this))
		
		bus.on('action.request.emphasis', function() {
			toggle_format(this.editor, 'emphasis')
		}.bind(this))
		
		bus.on('action.request.underline', function() {
			toggle_format(this.editor, 'underline')
		}.bind(this))
		
		bus.on('action.request.strikethrough', function() {
			toggle_format(this.editor, 'strikethrough')
		}.bind(this))
		
		bus.on('action.request.highlight', function() {
			toggle_format(this.editor, 'highlight')
		}.bind(this))
		
		bus.on('action.request.clear-formatting', function() {
			remove_formats(this.editor, ['hyperlink', 'strong', 'emphasis', 'underline', 'strikethrough', 'highlight'])
		}.bind(this))
		
		bus.on('keydown:control-b', function(event) {
			toggle_format(editor, 'strong')
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keydown:control-i', function(event) {
			toggle_format(editor, 'emphasis')
			event.preventDefault()
			return false
		}.bind(this))
		
		bus.on('keydown:control-u', function(event) {
			toggle_format(editor, 'underline')
			event.preventDefault()
			return false
		}.bind(this))
	}
	
	configure_blocks(bus, editor) {
		
		this.toolbar.append(`<button data-action="paragraph" data-element="p">Paragraph</button>`)
		this.toolbar.append(`<button data-action="heading-1" data-element="h1">Heading 1</button>`)
		this.toolbar.append(`<button data-action="heading-2" data-element="h2">Heading 2</button>`)
		this.toolbar.append(`<button data-action="list-item" data-element="li">List Item</button>`)
		this.toolbar.append(`<button data-action="ordered-list" data-element="ol">Ordered List</button>`)
		this.toolbar.append(`<button data-action="unordered-list" data-element="ul">Unordered List</button>`)
		this.toolbar.append(`<button data-action="blockquote">Blockquote</button>`)
		
		bus.on('action.request.paragraph', function() {
			toggle_block(editor, 'p')
		}.bind(this))
		
		bus.on('action.request.heading-1', function() {
			toggle_block(editor, 'h1')
		}.bind(this))
		
		bus.on('action.request.heading-2', function() {
			toggle_block(editor, 'h2')
		}.bind(this))
		
		bus.on('action.request.list-item', function() {
			toggle_block(editor, 'li')
		}.bind(this))
		
		bus.on('action.request.ordered-list', function() {
			toggle_block(editor, 'ol')
		}.bind(this))
		
		bus.on('action.request.unordered-list', function() {
			toggle_block(editor, 'ul')
		}.bind(this))
		
		bus.on('action.request.blockquote', function() {
			toggle_block(editor, 'blockquote')
		}.bind(this))
	}
	
	configure_atoms(bus, editor) {
		
		this.toolbar.append(`<button data-action="atom">Atom</button>`)
		
		bus.on('action.request.atom', function() {
			insert_atom(editor, `
				<span class="atom" data-atom-type="sample">@sample-atom</span>
			`)
		}.bind(this))
		
		bus.on('atom-will-enter:sample', function(atom) {
			atom.text('Sample Atom')
		}.bind(this))
		
		bus.on('atom-did-enter:sample', function(atom) {
			window.setTimeout(function() {
				atom.text('Sample Atom !!!')
			}, 1000)
		}.bind(this))
		
		bus.on('atom-will-exit:sample', function(atom) {
			logger('application').log('atom-will-exit:sample')
		}.bind(this))
		
		bus.on('atom-did-exit:sample', function(atom) {
			logger('application').log('atom-did-exit:sample')
		}.bind(this))
	}
	
	configure_cards(bus, editor) {
		
		this.toolbar.append(`<button data-action="card">Card: Sample</button>`)
		
		bus.on('action.request.card', function() {
			insert_card(editor, `
				<div class="card" data-card-type="sample"></div>
			`)
		}.bind(this))
		
		bus.on('card-will-enter:sample', function(card) {
			logger('application').log('card-will-enter:sample')
			card.text('Sample Card')
		}.bind(this))
		
		bus.on('card-did-enter:sample', function(card) {
			logger('application').log('card-did-enter:sample')
			window.setTimeout(function() {
				card.text('Sample Card !!!')
			}, 1000)
		}.bind(this))
		
		bus.on('card-will-exit:sample', function(card) {
			logger('application').log('card-will-exit:sample')
		}.bind(this))
		
		bus.on('card-did-exit:sample', function(card) {
			logger('application').log('card-did-exit:sample')
		}.bind(this))
		
		this.toolbar.append(`<button data-action="card-image">Card: Image</button>`)
		
		bus.on('action.request.card-image', function() {
			insert_card(editor, `
				<div class="card" data-card-type="image"></div>
			`)
		}.bind(this))
		
		bus.on('card-will-enter:image', function(card) {
			logger('application').log('card-will-enter:image')
			card.text('Image Card')
		}.bind(this))
		
		bus.on('card-did-enter:image', function(card) {
			logger('application').log('card-did-enter:image')
			window.setTimeout(function() {
				card.text('Image Card !!!')
			}, 1000)
		}.bind(this))
		
		bus.on('card-will-exit:image', function(card) {
			logger('application').log('card-will-exit:image')
		}.bind(this))
		
		bus.on('card-did-exit:image', function(card) {
			logger('application').log('card-did-exit:image')
		}.bind(this))
		
		this.toolbar.append(`<button data-action="card-timer">Card: Timer</button>`)
		
		bus.on('action.request.card-timer', function() {
			insert_card(editor, `
				<div class="card" data-card-type="timer"></div>
			`)
		}.bind(this))
		
		bus.on('card-will-enter:timer', function(card) {
			logger('application').log('card-will-enter:timer')
			card.text('Timer Card')
		}.bind(this))
		
		bus.on('card-did-enter:timer', function(card) {
			logger('application').log('card-did-enter:timer')
			window.setTimeout(function() {
				card.text('Timer Card !!!')
			}, 1000)
		}.bind(this))
		
		bus.on('card-will-exit:timer', function(card) {
			logger('application').log('card-will-exit:timer')
		}.bind(this))
		
		bus.on('card-did-exit:timer', function(card) {
			logger('application').log('card-did-exit:timer')
		}.bind(this))
	}
	
	configure_other(bus, editor) {
		
		this.toolbar.append(`<button data-action="validate">Validate</button>`)
		
		bus.on('action.request.validate', function() {
			let scanner = new Scanner(editor)
			scanner.scan(document.querySelector('.content'))
		}.bind(this))
		
		bus.on('selection:did-change', function(event, editor) {
			logger('application').log('selection:did-change')
			document.querySelector('.structure-html').textContent = serialize(this.editor)
		}.bind(this))
		
		bus.on('content:did-change', function(html) {
			logger('application').log('content:did-change')
			document.querySelector('.structure-html').textContent = serialize(this.editor)
			let scanner = new Scanner(editor)
			scanner.scan(document.querySelector('.content'))
		}.bind(this))
		
		bus.on('content:valid', function(html) {
			return
		}.bind(this))
		
		bus.on('content:invalid', function(result) {
			console.log('content:invalid: ' + JSON.stringify(result))
			u('.structure').addClass('invalid')
		}.bind(this))
		
		bus.on('content:did-insert', function() {
			logger('application').log('content:did-insert')
		})
		
		bus.on('content:did-delete', function(fragment) {
			if (false) logger('application').log('content:did-delete: ' + fragment)
		})
		
		bus.on('document:did-load', function() {
			logger('application').log('document:did-load')
		})
		
		bus.on('document:did-save', function() {
			logger('application').log('document:did-save')
		})
		
		bus.on('document:did-unload', function() {
			logger('application').log('document:did-unload')
		})
		
		bus.on('clipboard:will-cut', function() {
			logger('application').log('clipboard:will-cut')
		})
		
		bus.on('clipboard:did-cut', function() {
			logger('application').log('clipboard:did-cut')
		})
		
		bus.on('clipboard:will-copy', function() {
			logger('application').log('clipboard:will-copy')
		})
		
		bus.on('clipboard:did-copy', function() {
			logger('application').log('clipboard:did-copy')
		})
		
		bus.on('clipboard:will-paste', function() {
			logger('application').log('clipboard:will-paste')
		})
		
		bus.on('clipboard:did-paste', function() {
			logger('application').log('clipboard:did-paste')
		})
		
		bus.on('caret:did-change', function() {
			logger('application').log('caret:did-change')
		})
		
		bus.on('command:did-invoke', function() {
			logger('application').log('command:did-invoke')
		})
		
		bus.on('command:did-add', function() {
			logger('application').log('command:did-add')
		})
		
		bus.on('command:did-remove', function() {
			logger('application').log('command:did-remove')
		})
		
		bus.on('key:enter', function() {
			logger('application').log('key:enter')
		})
	}
	
	apply_selection_by_positions() {
		
		let element = document.querySelector('.content')
		set_selection_by_positions(element, { head: 15, tail: 25 })
		set_selection_by_positions(element, { element: element})
		let selection = get_selection(element)
		if (false) logger('application').log('selection: ' + JSON.stringify(selection, null, 2))
	}
}
