
import { Bus } from './bus.js'
import { Editor } from './editor.js'
import { History } from './history.js'
import { Toolbar } from './toolbar.js'
import { Scanner } from './scanner.js'
import { a_block_element } from './basics.js'
import { get_selection, set_selection, select_all, selection_to_string } from './selection.js'
import { skip_left_over_zero_width_whitespace, skip_right_over_zero_width_whitespace } from './keyboard.js'
import { toggle_format, toggle_format_with_data, remove_formats } from './features/formats.js'
import { toggle_block, transform_block, block_has_content } from './features/blocks.js'
import { indent, dedent, align } from './features/blocks.js'
import { initialize_hyperlinks, detect_hyperlinks } from './features/hyperlinks.js'
import { initialize_clipboard } from './clipboard.js'
import { initialize_platform } from './platform.js'
import { initialize_atoms, insert_atom, is_atom } from './features/atoms.js'
import { initialize_cards, insert_card, is_card } from './features/cards.js'
import { initialize_sample_atoms } from './atoms/sample.js'
import { initialize_animated_atoms } from './atoms/animated.js'
import { initialize_mention_atoms } from './atoms/mention.js'
import { initialize_sample_cards } from './cards/sample.js'
import { initialize_animated_cards } from './cards/animated.js'
import { initialize_editable_cards } from './cards/editable.js'
import { initialize_design_block_cards } from './cards/design-block.js'
import { initialize_image_cards } from './cards/image.js'
import { initialize_code_cards } from './cards/code.js'
import { initialize_recognizers } from './features/recognizers.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger(['trace-off', 'bus-off', 'system-off', 'editor-off', 'history-off', 'toolbar-off', 'formats-off', 'scanner-off'])

export class System {
	
	constructor() {
		
		this.bus = new Bus()
		this.editor = new Editor(this.bus, document.querySelector('.editor'))
		this.toolbar = new Toolbar(this.bus)
		this.history = new History(this.bus, document.querySelector('.content'))
		this.scanner = new Scanner(this.editor)
		this.offer_features(this.bus, this.editor, this.history, this.toolbar)
		this.enable_features(this.bus, [
			'essentials',
			'formats',
			'formats-all',
			'blocks',
			'blocks-all',
			'atoms',
			'cards',
			'other',
			'recognizers',
			'platform'
		])
	}
	
	enable_features(bus, features) {
		
		features.forEach(function(key) {
			this.enable_feature(key, bus)
		}.bind(this))
	}
	
	enable_feature(feature, bus) {
		bus.emit(`feature:${feature}`)
	}
	
	offer_features(bus, editor, history, toolbar) {
		
		bus.on('feature:essentials', function() {
			this.enable_feature('toolbar', bus)
			this.enable_feature('documents', bus)
			this.enable_feature('history', bus)
			this.enable_feature('basics', bus)
			this.enable_feature('clipboard', bus)
		}.bind(this))
		
		bus.on('feature:toolbar', function() {
			bus.on('feature-did-install', function(name, label) {
				toolbar.append(`<button data-action="${name}">${label}</button>`)
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:documents', function() {
			bus.on('document-did-install', function(document_) {
				logger('system').log('document-did-install')
				this.history.enable()
				this.scanner.scan(document.querySelector('.content'))
			}.bind(this))
			bus.on('document-did-uninstall', function(document_) {
				logger('system').log('document-did-uninstall')
				this.history.disable()
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:basics', function() {
			
			if (false) {
				toolbar.append(`<button data-action="hyperlink">Link</button>`)
				toolbar.append(`<button data-action="image">Image</button>`)
				toolbar.append(`<button data-action="code">Code</button>`)
				toolbar.append(`<button data-action="metadata">Metadata</button>`)
				toolbar.append(`<button data-action="formula">Formula</button>`)
			}
			
			bus.on('keydown:alphanumeric', function(event) {
				if (editor.can_insert_character(event)) {
					editor.request_to_insert_character(event)
				}
			}.bind(this))
			
			bus.on('keydown:enter', function(event) {
				editor.request_to_split_content(event)
			}.bind(this))
			
			bus.on('keydown:backspace', function(event) {
				editor.request_to_delete(event)
			}.bind(this))
			
			bus.on('keyup:backspace', function(event) {
				event.preventDefault()
			}.bind(this))
			
			bus.on('request:select-all', function(event) {
				select_all(editor, event)
			}.bind(this))
			
			bus.on('keydown:control-a', function(event) {
				bus.emit('request:select-all', event)
			}.bind(this))
			
			bus.on('request:caret-right', function(event) {
				skip_right_over_zero_width_whitespace(event, editor)
			}.bind(this))
			
			bus.on('keyup:arrowright', function(event) {
				bus.emit('request:caret-right', event)
			}.bind(this))
			
			bus.on('request:caret-left', function(event) {
				skip_left_over_zero_width_whitespace(event, editor)
			}.bind(this))
			
			bus.on('keyup:arrowleft', function(event) {
				bus.emit('request:caret-left', event)
			}.bind(this))
			
			bus.on('request:undo', function() {
				this.history.undo(event)
			}.bind(this))
			
			bus.on('keydown:control-z', function(event) {
				bus.emit('request:undo', event)
			}.bind(this))
			
			bus.emit('feature-did-install', 'undo', 'Undo')
			
			bus.on('request:redo', function() {
				this.history.redo(event)
			}.bind(this))
			
			bus.on('keydown:control-shift-z', function(event) {
				bus.emit('request:redo', event)
			}.bind(this))

			bus.emit('feature-did-install', 'redo', 'Redo')
			
		}.bind(this))
		
		bus.on('feature:history', function() {
			
			let selections = []
			let selection = null
			
			bus.on('selection-did-change', function(editor) {
				if (! this.history.enabled) return
				let selection = get_selection(editor)
				selections.push(selection)
			}.bind(this))
			
			bus.on('history-did-begin-mutations', function(data) {
				if (selections.length > 0) {
					selection = selections[selections.length - 1]
					selections = []
				}
			}.bind(this))
			
			bus.on('history-did-capture', function(record) {
				record.selection.before = selection
				record.selection.after = get_selection(editor)
			}.bind(this))
			
			bus.on('history-did-undo', function() {
				let record = this.history.records[this.history.index]
				if (record && record.selection && record.selection.before) {
					set_selection(editor, record.selection.before)
				}
			}.bind(this))
			
			bus.on('history-did-redo', function() {
				let record = this.history.records[this.history.index + 1]
				if (record && record.selection && record.selection.after) {
					set_selection(editor, record.selection.after)
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
			
			bus.on('clipboard-did-cut', function(event) {
				this.history.capture()
			}.bind(this))
			
			bus.on('clipboard-did-paste', function(event) {
				this.history.capture()
			}.bind(this))
			
		}.bind(this))
		
		bus.on('feature:clipboard', function() {
			initialize_clipboard(editor)
			bus.on('clipboard-will-cut', function() {
				logger('system').log('clipboard-will-cut')
			})
			bus.on('clipboard-did-cut', function() {
				logger('system').log('clipboard-did-cut')
			})
			bus.on('clipboard-will-copy', function() {
				logger('system').log('clipboard-will-copy')
			})
			bus.on('clipboard-did-copy', function() {
				logger('system').log('clipboard-did-copy')
			})
			bus.on('clipboard-will-paste', function() {
				logger('system').log('clipboard-will-paste')
			})
			bus.on('clipboard-did-paste', function() {
				logger('system').log('clipboard-did-paste')
			})
			
		}.bind(this))
		
		bus.on('feature:formats', function() {
			bus.on('format-did-apply', function(event) {
				this.history.capture()
			}.bind(this))
			bus.on('format-did-remove', function(event) {
				this.history.capture()
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:formats-all', function() {
			this.enable_feature('format-hyperlink', bus)
			this.enable_feature('format-strong', bus)
			this.enable_feature('format-emphasis', bus)
			this.enable_feature('format-underline', bus)
			this.enable_feature('format-strikethrough', bus)
			this.enable_feature('format-highlight', bus)
			this.enable_feature('format-clear', bus)
		}.bind(this))
		
		bus.on('feature:format-hyperlink', function() {
			initialize_hyperlinks(editor, bus)
			detect_hyperlinks(editor, bus)
			bus.on('request:hyperlink', function() {
				let result = window.prompt('Enter a URL', 'http://github.com')
				if (result) toggle_format_with_data(editor, 'hyperlink', { href: result })
			}.bind(this))
			bus.on('hyperlink:clicked', function(href, event) {
				if (event && event.ctrlKey) {
					window.open(href)
				} else {
					window.location.href = href
				}
			}.bind(this))
			bus.emit('feature-did-install', 'hyperlink', 'Hyperlink')
		}.bind(this))
		
		bus.on('feature:format-strong', function() {
			bus.on('request:strong', function(event) {
				toggle_format(editor, 'strong', event)
			}.bind(this))
			bus.on('keydown:control-b', function(event) {
				bus.emit('request:strong', event)
			}.bind(this))
			bus.emit('feature-did-install', 'strong', 'Strong')
		}.bind(this))
		
		bus.on('feature:format-emphasis', function() {
			bus.on('request:emphasis', function(event) {
				toggle_format(editor, 'emphasis', event)
			}.bind(this))
			bus.on('keydown:control-i', function(event) {
				bus.emit('request:emphasis', event)
			}.bind(this))
			bus.emit('feature-did-install', 'emphasis', 'Emphasis')
		}.bind(this))
		
		bus.on('feature:format-underline', function() {
			bus.on('request:underline', function(event) {
				toggle_format(editor, 'underline', event)
			}.bind(this))
			bus.on('keydown:control-u', function(event) {
				bus.emit('request:underline', event)
			}.bind(this))
			bus.emit('feature-did-install', 'underline', 'Underline')
		}.bind(this))
		
		bus.on('feature:format-strikethrough', function() {
			bus.on('request:strikethrough', function() {
				toggle_format(editor, 'strikethrough')
			}.bind(this))
			bus.emit('feature-did-install', 'strikethrough', 'Strikethrough')
		}.bind(this))
		
		bus.on('feature:format-highlight', function() {
			bus.on('request:highlight', function() {
				toggle_format(editor, 'highlight')
			}.bind(this))
			bus.emit('feature-did-install', 'highlight', 'Highlight')
		}.bind(this))
		
		bus.on('feature:format-clear', function() {
			bus.on('request:clear-formatting', function() {
				remove_formats(editor, ['hyperlink', 'strong', 'emphasis', 'underline', 'strikethrough', 'highlight'])
			}.bind(this))
			bus.emit('feature-did-install', 'clear-formatting', 'Clear Formatting')
		}.bind(this))
		
		bus.on('feature:blocks', function() {
			bus.on('block-did-change', function(event) {
				this.history.capture()
			}.bind(this))
			bus.on('content-did-split', function(a, b) {
				if (block_has_content(a)) return
				if (block_has_content(b)) return
				transform_block(editor, b, 'p')
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:blocks-all', function() {
			this.enable_feature('blocks-paragraph', bus)
			this.enable_feature('blocks-heading-1', bus)
			this.enable_feature('blocks-heading-2', bus)
			this.enable_feature('blocks-list-item', bus)
			if (false) this.enable_feature('blocks-ordered-list', bus)
			if (false) this.enable_feature('blocks-unordered-list', bus)
			this.enable_feature('blocks-blockquote', bus)
			this.enable_feature('blocks-indentation', bus)
			this.enable_feature('blocks-alignment', bus)
		}.bind(this))
		
		bus.on('feature:blocks-paragraph', function() {
			bus.on('request:paragraph', function() {
				toggle_block(editor, 'p')
			}.bind(this))
			bus.emit('feature-did-install', 'paragraph', 'Paragraph')
		}.bind(this))
		
		bus.on('feature:blocks-heading-1', function() {
			bus.on('request:heading-1', function() {
				toggle_block(editor, 'h1')
			}.bind(this))
			bus.emit('feature-did-install', 'heading-1', 'Heading 1')
		}.bind(this))
		
		bus.on('feature:blocks-heading-2', function() {
			bus.on('request:heading-2', function() {
				toggle_block(editor, 'h2')
			}.bind(this))
			bus.emit('feature-did-install', 'heading-2', 'Heading 2')
		}.bind(this))
		
		bus.on('feature:blocks-list-item', function() {
			bus.on('request:list-item', function() {
				toggle_block(editor, 'li')
			}.bind(this))
			bus.emit('feature-did-install', 'list-item', 'List Item')
		}.bind(this))
		
		bus.on('feature:blocks-ordered-list', function() {
			bus.on('request:ordered-list', function() {
				toggle_block(editor, 'ol')
			}.bind(this))
			bus.emit('feature-did-install', 'ordered-list', 'Ordered List')
		}.bind(this))
		
		bus.on('feature:blocks-unordered-list', function() {
			bus.on('request:unordered-list', function() {
				toggle_block(editor, 'ul')
			}.bind(this))
			bus.emit('feature-did-install', 'unordered-list', 'Unordered List')
		}.bind(this))
		
		bus.on('feature:blocks-blockquote', function() {
			bus.on('request:blockquote', function() {
				toggle_block(editor, 'blockquote')
			}.bind(this))
			bus.emit('feature-did-install', 'blockquote', 'Blockquote')
		}.bind(this))
		
		bus.on('feature:blocks-indentation', function() {
			bus.on('request:indent', function(event) {
				indent(editor, event)
			}.bind(this))
			bus.on('keydown:tab', function(event) {
				bus.emit('request:indent', event)
			}.bind(this))
			bus.on('keydown:control-]', function(event) {
				bus.emit('request:indent', event)
			}.bind(this))
			bus.emit('feature-did-install', 'indent', 'Indent')
			bus.on('request:dedent', function(event) {
				dedent(editor, event)
			}.bind(this))
			bus.on('keydown:shift-tab', function(event) {
				bus.emit('request:dedent', event)
			}.bind(this))
			bus.on('keydown:control-[', function(event) {
				bus.emit('request:dedent', event)
			}.bind(this))
			bus.emit('feature-did-install', 'dedent', 'Dedent')
		}.bind(this))
		
		bus.on('feature:blocks-alignment', function() {
			bus.on('request:align-left', function() {
				align(editor, 'left')
			}.bind(this))
			bus.emit('feature-did-install', 'align-left', 'Align Left')
			bus.on('request:align-right', function() {
				align(editor, 'right')
			}.bind(this))
			bus.emit('feature-did-install', 'align-right', 'Align Right')
			bus.on('request:align-center', function() {
				align(editor, 'center')
			}.bind(this))
			bus.emit('feature-did-install', 'align-center', 'Align Center')
			bus.on('request:align-justify', function() {
				align(editor, 'justify')
			}.bind(this))
			bus.emit('feature-did-install', 'align-justified', 'Align Justify')
		}.bind(this))
		
		bus.on('feature:atoms', function() {
			initialize_atoms(bus, editor, history)
			initialize_sample_atoms(bus, editor, toolbar)
			initialize_animated_atoms(bus, editor, toolbar)
			initialize_mention_atoms(bus, editor, toolbar)
		}.bind(this))
		
		bus.on('feature:cards', function() {
			initialize_cards(bus, editor, history)
			initialize_sample_cards(bus, editor, toolbar)
			initialize_animated_cards(bus, editor, toolbar)
			initialize_image_cards(bus, editor, toolbar)
			initialize_editable_cards(bus, editor, toolbar)
			initialize_design_block_cards(bus, editor, toolbar)
			initialize_code_cards(bus, editor, toolbar)
		}.bind(this))
		
		bus.on('feature:recognizers', function() {
			initialize_recognizers(bus, editor)
		}.bind(this))
		
		bus.on('feature:platform', function() {
			initialize_platform(bus)
		}.bind(this))
		
		bus.on('feature:other', function() {
			bus.on('request:validate', function() {
				this.scanner.scan(document.querySelector('.content'))
			}.bind(this))
			bus.emit('feature-did-install', 'validate', 'Validate')
			bus.on('selection-did-change', function(event, editor) {
				logger('system').log('selection-did-change')
				document.querySelector('.structure-html').textContent = serialize(editor)
			}.bind(this))
			bus.on('content-did-change', function(begin, end) {
				logger('system').log('content-did-change')
				this.scanner.scan(begin, end)
				document.querySelector('.structure-html').textContent = serialize(editor)
			}.bind(this))
			bus.on('content-did-insert', function() {
				logger('system').log('content-did-insert')
			})
			bus.on('content-did-delete', function(fragment) {
				if (false) logger('system').log('content-did-delete: ' + fragment)
			})
			bus.on('content-valid', function(html) {
				return
			}.bind(this))
			bus.on('content-invalid', function(result) {
				console.log('content-invalid: ' + JSON.stringify(result))
				u('.structure').addClass('invalid')
			}.bind(this))
		}.bind(this))
	}
	
	install_document(document_) {
		
		this.document_ = document_
		u('.content').empty().append(u(document_.content))
		this.bus.emit('document-did-install', document_)
	}
}
