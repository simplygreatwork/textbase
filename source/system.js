
import { Bus } from './bus.js'
import { Editor } from './editor.js'
import { History } from './history.js'
import { Toolbar } from './toolbar.js'
import { Scanner } from './scanner.js'
import { an_inline_element, a_block_element } from './basics.js'
import { get_selection, set_selection, select_all, selection_to_string } from './selection.js'
import { caret_left, caret_right, caret_up, caret_down } from './keyboard.js'
import { toggle_format, remove_formats, find_active_formats, find_applicable_formats } from './features/formats.js'
import { toggle_block, find_active_block, find_applicable_blocks } from './features/blocks.js'
import { indent, dedent } from './features/blocks.js'
import { initialize_hyperlinks, detect_hyperlinks } from './features/hyperlinks.js'
import { initialize_clipboard } from './clipboard.js'
import { insert_card, watch_cards_will_enter, watch_cards_will_exit, watch_cards_did_enter, watch_cards_did_exit } from './features/cards.js'
import { insert_atom, watch_atoms_will_enter, watch_atoms_will_exit, watch_atoms_did_enter, watch_atoms_did_exit } from './features/atoms.js'
import { serialize } from './serialize.js'
import { initialize_sample_cards } from './cards/sample.js'
import { initialize_animated_cards } from './cards/animated.js'
import { initialize_image_cards } from './cards/image.js'
import { initialize_recognizers } from './features/recognizers.js'
import { Logger } from './logger.js'

const logger = Logger(['trace-off', 'system-off', 'editor-off', 'toolbar-off', 'formats-off', 'scanner-off'])

export class System {
	
	constructor() {
		
		this.bus = new Bus()
		this.editor = new Editor(this.bus, document.querySelector('.editor') )
		this.toolbar = new Toolbar(this.bus)
		this.history = new History(this.bus, document.querySelector('.content'))
		this.configure(this.bus, this.editor, this.toolbar)
		this.bus.on('document:did-load', function() {
			this.history.enable()
			this.scanner = new Scanner(this.editor)
			this.scanner.scan(document.querySelector('.content'))
		}.bind(this))
		this.load_document('./documents/all.html')
	}
	
	load_document(path) {
		
		fetch(path)
		.then(response => response.text())
		.then(function(data) {
			u('.content').empty().append(u(data))
			this.bus.emit('document:did-load')
		}.bind(this))
	}
	
	configure(bus, editor, toolbar) {
		
		this.configure_history_selections(bus, editor, toolbar)
		this.configure_basics(bus, editor, toolbar)
		this.configure_formats(bus, editor, toolbar)
		this.configure_blocks(bus, editor, toolbar)
		this.configure_atoms(bus, editor, toolbar)
		this.configure_cards(bus, editor, toolbar)
		this.configure_recognizers(bus, editor, toolbar)
		this.configure_other(bus, editor, toolbar)
	}
	
	configure_history_selections(bus, editor, toolbar) {
		
		let selections = []
		let selection = null
		
		bus.on('selection:did-change', function(editor) {
			if (! this.history.enabled) return
			let selection = get_selection(this.editor)
			selections.push(selection)
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
		
		bus.on('history:did-undo', function() {
			let record = this.history.records[this.history.index]
			if (record && record.selection && record.selection.before) {
				set_selection(this.editor, record.selection.before)
			}
		}.bind(this))
		
		bus.on('history:did-redo', function() {
			let record = this.history.records[this.history.index + 1]
			if (record && record.selection && record.selection.after) {
				set_selection(this.editor, record.selection.after)
			}
		}.bind(this))
		
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
	
	configure_basics(bus, editor, toolbar) {
		
		if (false) {
			toolbar.append(`<button data-action="hyperlink">Link</button>`)
			toolbar.append(`<button data-action="image">Image</button>`)
			toolbar.append(`<button data-action="code">Code</button>`)
			toolbar.append(`<button data-action="metadata">Metadata</button>`)
			toolbar.append(`<button data-action="formula">Formula</button>`)
		}
		
		bus.on('keydown:alphanumeric', function(event) {
			if (editor.can_insert_character(event)) {
				editor.insert_character(event)
			}
		}.bind(this))
		
		bus.on('keydown:enter', function(event) {
			editor.split_content(event, a_block_element)
		}.bind(this))
		
		bus.on('keydown:backspace', function(event) {
			editor.delete_(event)
		}.bind(this))
		
		bus.on('keyup:backspace', function(event) {
			event.preventDefault()
		}.bind(this))
		
		bus.on('keydown:tab', function(event) {
			indent(event, editor)
		}.bind(this))
		
		bus.on('keydown:control-]', function(event) {
			indent(event, editor)
		}.bind(this))
		
		bus.on('keydown:shift-tab', function(event) {
			dedent(event, editor)
		}.bind(this))
		
		bus.on('keydown:control-[', function(event) {
			dedent(event, editor)
		}.bind(this))
		
		bus.on('keydown:control-a', function(event) {
			select_all(event, editor)
		}.bind(this))
		
		bus.on('keydown:control-z', function(event) {
			this.history.undo(event)
		}.bind(this))
		
		bus.on('keydown:control-shift-z', function(event) {
			this.history.redo(event)
		}.bind(this))
		
		bus.on('keyup:arrowright', function(event) {
			caret_right(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowleft', function(event) {
			caret_left(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowdown', function(event) {
			caret_down(event, editor)
		}.bind(this))
		
		bus.on('keyup:arrowup', function(event) {
			caret_up(event, editor)
		}.bind(this))
		
		initialize_clipboard(editor)
		
		toolbar.append(`<button data-action="indent">Indent</button>`)
		toolbar.append(`<button data-action="dedent">Dedent</button>`)
		
		bus.on('action.request.indent', function() {
			indent(editor)
		}.bind(this))
		
		bus.on('action.request.dedent', function() {
			dedent(editor)
		}.bind(this))
	}
	
	configure_formats(bus, editor, toolbar) {
		
		toolbar.append(`<button data-action="hyperlink" data-format="hyperlink">Hyperlink</button>`)
		toolbar.append(`<button data-action="strong" data-format="strong">Strong</button>`)
		toolbar.append(`<button data-action="emphasis" data-format="emphasis">Emphasis</button>`)
		toolbar.append(`<button data-action="underline" data-format="underline">Underline</button>`)
		toolbar.append(`<button data-action="strikethrough" data-format="strikethrough">Strikethrough</button>`)
		toolbar.append(`<button data-action="highlight" data-format="highlight">Highlight</button>`)
		toolbar.append(`<button data-action="clear-formatting">Clear Formatting</button>`)
		
		initialize_hyperlinks(editor, bus)
		detect_hyperlinks(editor, bus)
		
		bus.on('action.request.hyperlink', function() {
			let result = window.prompt('Enter a URL', 'http://github.com')
			if (result) toggle_format(this.editor, 'hyperlink', { href: result })
		}.bind(this))
		
		bus.on('hyperlink:clicked', function(href, event) {
			if (event && event.ctrlKey) {
				window.open(href)
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
			event.preventDefault()
			toggle_format(editor, 'strong')
		}.bind(this))
		
		bus.on('keydown:control-i', function(event) {
			event.preventDefault()
			toggle_format(editor, 'emphasis')
		}.bind(this))
		
		bus.on('keydown:control-u', function(event) {
			event.preventDefault()
			toggle_format(editor, 'underline')
		}.bind(this))
	}
	
	configure_blocks(bus, editor, toolbar) {
		
		toolbar.append(`<button data-action="paragraph" data-element="p">Paragraph</button>`)
		toolbar.append(`<button data-action="heading-1" data-element="h1">Heading 1</button>`)
		toolbar.append(`<button data-action="heading-2" data-element="h2">Heading 2</button>`)
		toolbar.append(`<button data-action="list-item" data-element="li">List Item</button>`)
		if (false) toolbar.append(`<button data-action="ordered-list" data-element="ol">Ordered List</button>`)
		if (false) toolbar.append(`<button data-action="unordered-list" data-element="ul">Unordered List</button>`)
		toolbar.append(`<button data-action="blockquote">Blockquote</button>`)
		
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
	
	configure_atoms(bus, editor, toolbar) {
		
		bus.on('history:will-undo', function(added, removed) {
			watch_atoms_will_enter(added, bus)
			watch_atoms_will_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:did-undo', function(added, removed) {
			watch_atoms_did_enter(added, bus)
			watch_atoms_did_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:will-redo', function(added, removed) {
			watch_atoms_will_enter(added, bus)
			watch_atoms_will_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:did-redo', function(added, removed) {
			watch_atoms_did_enter(added, bus)
			watch_atoms_did_exit(removed, bus)
		}.bind(this))
		
		toolbar.append(`<button data-action="atom-sample">Atom</button>`)
		
		bus.on('action.request.atom-sample', function() {
			insert_atom(editor, `
				<span class="atom" data-atom-type="sample">@sample-atom</span>
			`)
		}.bind(this))
		
		bus.on('atom-will-enter:sample', function(atom) {
			u(atom).text('Sample Atom')
		}.bind(this))
		
		bus.on('atom-did-enter:sample', function(atom) {
			window.setTimeout(function() {
				u(atom).text('Sample Atom !!!')
			}, 1000)
		}.bind(this))
		
		bus.on('atom-will-exit:sample', function(atom) {
			logger('system').log('atom-will-exit:sample')
		}.bind(this))
		
		bus.on('atom-did-exit:sample', function(atom) {
			logger('system').log('atom-did-exit:sample')
		}.bind(this))
	}
	
	configure_cards(bus, editor, toolbar) {
		
		bus.on('history:will-undo', function(added, removed) {
			watch_cards_will_enter(added, bus)
			watch_cards_will_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:did-undo', function(added, removed) {
			watch_cards_did_enter(added, bus)
			watch_cards_did_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:will-redo', function(added, removed) {
			watch_cards_will_enter(added, bus)
			watch_cards_will_exit(removed, bus)
		}.bind(this))
		
		bus.on('history:did-redo', function(added, removed) {
			watch_cards_did_enter(added, bus)
			watch_cards_did_exit(removed, bus)
		}.bind(this))
		
		initialize_sample_cards(bus, editor, toolbar)
		initialize_animated_cards(bus, editor, toolbar)
		initialize_image_cards(bus, editor, toolbar)
	}
	
	configure_recognizers(bus, editor, toolbar) {
		
		initialize_recognizers(bus, editor)
	}

	configure_other(bus, editor, toolbar) {
		
		toolbar.append(`<button data-action="validate">Validate</button>`)
		
		bus.on('action.request.validate', function() {
			this.scanner.scan(document.querySelector('.content'))
		}.bind(this))
		
		bus.on('selection:did-change', function(event, editor) {
			logger('system').log('selection:did-change')
			document.querySelector('.structure-html').textContent = serialize(this.editor)
		}.bind(this))
		
		bus.on('content:did-change', function(begin, end) {
			logger('system').log('content:did-change')
			document.querySelector('.structure-html').textContent = serialize(this.editor)
			this.scanner.scan(begin, end)
		}.bind(this))
		
		bus.on('content:valid', function(html) {
			return
		}.bind(this))
		
		bus.on('content:invalid', function(result) {
			console.log('content:invalid: ' + JSON.stringify(result))
			u('.structure').addClass('invalid')
		}.bind(this))
		
		bus.on('content:did-insert', function() {
			logger('system').log('content:did-insert')
		})
		
		bus.on('content:did-delete', function(fragment) {
			if (false) logger('system').log('content:did-delete: ' + fragment)
		})
		
		bus.on('document:did-load', function() {
			logger('system').log('document:did-load')
		})
		
		bus.on('document:did-save', function() {
			logger('system').log('document:did-save')
		})
		
		bus.on('document:did-unload', function() {
			logger('system').log('document:did-unload')
		})
		
		bus.on('clipboard:will-cut', function() {
			logger('system').log('clipboard:will-cut')
		})
		
		bus.on('clipboard:did-cut', function() {
			logger('system').log('clipboard:did-cut')
		})
		
		bus.on('clipboard:will-copy', function() {
			logger('system').log('clipboard:will-copy')
		})
		
		bus.on('clipboard:did-copy', function() {
			logger('system').log('clipboard:did-copy')
		})
		
		bus.on('clipboard:will-paste', function() {
			logger('system').log('clipboard:will-paste')
		})
		
		bus.on('clipboard:did-paste', function() {
			logger('system').log('clipboard:did-paste')
		})
		
		bus.on('caret:did-change', function() {
			logger('system').log('caret:did-change')
		})
		
		bus.on('command:did-invoke', function() {
			logger('system').log('command:did-invoke')
		})
		
		bus.on('command:did-add', function() {
			logger('system').log('command:did-add')
		})
		
		bus.on('command:did-remove', function() {
			logger('system').log('command:did-remove')
		})
		
		bus.on('key:enter', function() {
			logger('system').log('key:enter')
		})
	}
}