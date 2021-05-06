
import { Bus } from './bus.js'
import { Editor } from './editor.js'
import { History } from './history.js'
import { Toolbar } from './toolbar.js'
import { Enforcer } from './enforcer.js'
import { Sanitizer } from './sanitizer.js'
import { Structure } from './structure.js'
import { a_block_element, consume_event, debounce } from './basics.js'
import { get_selection, set_selection, select_all, selection_to_string } from './selection.js'
import { skip_left_over_zero_width_whitespace, skip_right_over_zero_width_whitespace } from './navigation.js'
import { extend_selection_right, extend_selection_left } from './navigation.js'
import { extend_selection_down, extend_selection_up } from './navigation.js'
import { toggle_format, toggle_format_with_data, remove_formats } from './features/formats.js'
import { toggle_block, transform_block, block_has_content } from './features/blocks.js'
import { indent, dedent, align } from './features/blocks.js'
import { initialize_hyperlinks, detect_hyperlinks } from './features/hyperlinks.js'
import { initialize_clipboard } from './clipboard.js'
import { initialize_platform } from './platform.js'
import { initialize_atoms } from './features/atoms.js'
import { initialize_cards } from './features/cards.js'
import { initialize_sample_atoms } from './atoms/sample.js'
import { initialize_animated_atoms } from './atoms/animated.js'
import { initialize_mention_atoms } from './atoms/mention.js'
import { initialize_code_atoms } from './atoms/code.js'
import { initialize_hyperlink_atoms } from './atoms/hyperlink.js'
import { initialize_sample_cards } from './cards/sample.js'
import { initialize_animated_cards } from './cards/animated.js'
import { initialize_editable_cards } from './cards/editable.js'
import { initialize_design_block_cards } from './cards/design-block.js'
import { initialize_image_cards } from './cards/image.js'
import { initialize_code_cards } from './cards/code.js'
import { initialize_recognizers } from './features/recognizers.js'
import { serialize } from './serialize.js'
import { Logger } from './logger.js'

const logger = Logger(['trace-off', 'bus-off', 'system-off', 'editor-off', 'history-off', 'toolbar-off', 'enforcer-off', 'sanitizer', 'clipboard-off', 'formats-off'])

export class System {
	
	constructor(features) {
		
		features = features || [
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
		]
		
		this.bus = new Bus()
		this.editor = new Editor(this.bus, document.querySelector('.editor'))
		this.history = new History(this.bus, document.querySelector('.content'))
		this.toolbar = new Toolbar(this.bus)
		this.enforcer = new Enforcer(this.editor)
		this.sanitizer = new Sanitizer(this.editor)
		this.structure = new Structure(this.bus, this.editor)
		this.offer_features(this.bus, this.editor, this.history, this.toolbar, this.enforcer, this.sanitizer, this.structure)
		this.enable_features(this.bus, features)
		if (true) this.sanitizer.example()
	}
	
	enable_features(bus, features) {
		
		features.forEach(function(key) {
			this.enable_feature(key, bus)
		}.bind(this))
	}
	
	enable_feature(feature, bus) {
		
		bus.emit(`feature`, feature)
		bus.emit(`feature:${feature}`)
	}
	
	offer_features(bus, editor, history, toolbar, enforcer, sanitizer, structure) {
		
		let features = {}
		bus.on('feature', function(name) {
			if (features[name]) throw Error(`The feature "${name}" cannot be enabled a second time.`)
			features[name] = true
		}.bind(this))
		
		bus.on('feature:essentials', function() {
			this.enable_feature('toolbar', bus)
			this.enable_feature('documents', bus)
			this.enable_feature('history', bus)
			this.enable_feature('basics', bus)
			this.enable_feature('clipboard', bus)
		}.bind(this))
		
		bus.on('feature:toolbar', function() {
			bus.on('feature-did-enable', function(name, label, kind, value) {
				let element = u(`<button data-action="${name}">${label}</button>`)
				if (kind) element.data(kind, value)
				toolbar.append(element.first())
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:documents', function() {
			bus.on('document-did-install', function(document_) {
				logger('system').log('document-did-install')
				this.enforcer.scan(document.querySelector('.content'))
				this.history.enable()
				this.structure.render()
			}.bind(this))
			bus.on('document-did-uninstall', function(document_) {
				logger('system').log('document-did-uninstall')
				this.history.disable()
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:basics', function() {
			
			bus.on('action:toggle-structure', function() {
				this.structure.toggle()
			}.bind(this))
			bus.emit('feature-did-enable', 'toggle-structure', 'Toggle Structure')
			
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
				this.history.capture()
			}.bind(this))
			
			bus.on('keydown:backspace', function(event) {
				editor.request_to_delete(event)
			}.bind(this))
			
			bus.on('keyup:backspace', function(event) {
				consume_event(event)
			}.bind(this))
			
			bus.on('action:select-all', function(event) {
				select_all(editor, event)
			}.bind(this))
			
			bus.on('keydown:control-a', function(event) {
				bus.emit('action:select-all', event)
			}.bind(this))
			
			bus.on('action:caret-right', function(event) {
				skip_right_over_zero_width_whitespace(event, editor)
			}.bind(this))
			
			bus.on('keyup:arrowright', function(event) {
				bus.emit('action:caret-right', event)
			}.bind(this))
			
			bus.on('action:caret-left', function(event) {
				skip_left_over_zero_width_whitespace(event, editor)
			}.bind(this))
			
			bus.on('keyup:arrowleft', function(event) {
				bus.emit('action:caret-left', event)
			}.bind(this))
			
			bus.on('action:caret-right-extend-selection', function(event) {
				extend_selection_right(event, editor)
			}.bind(this))
			
			bus.on('keydown:shift-arrowright', function(event) {
				bus.emit('action:caret-right-extend-selection', event)
			}.bind(this))
			
			bus.on('action:caret-left-extend-selection', function(event) {
				extend_selection_left(event, editor)
			}.bind(this))
			
			bus.on('keydown:shift-arrowleft', function(event) {
				bus.emit('action:caret-left-extend-selection', event)
			}.bind(this))
			
			bus.on('action:caret-down-extend-selection', function(event) {
				extend_selection_down(event, editor)
			}.bind(this))
			
			bus.on('keydown:shift-arrowdown', function(event) {
				bus.emit('action:caret-down-extend-selection', event)
			}.bind(this))
			
			bus.on('action:caret-up-extend-selection', function(event) {
				extend_selection_up(event, editor)
			}.bind(this))
			
			bus.on('keydown:shift-arrowup', function(event) {
				bus.emit('action:caret-up-extend-selection', event)
			}.bind(this))
			
			bus.on('action:undo', function() {
				this.history.undo(event)
			}.bind(this))
			
			bus.on('keydown:control-z', function(event) {
				bus.emit('action:undo', event)
			}.bind(this))
			
			bus.emit('feature-did-enable', 'undo', 'Undo')
			
			bus.on('action:redo', function() {
				this.history.redo(event)
			}.bind(this))
			
			bus.on('keydown:control-shift-z', function(event) {
				bus.emit('action:redo', event)
			}.bind(this))
			
			bus.emit('feature-did-enable', 'redo', 'Redo')
			
			bus.on('keydown:control-b', function(event) {
				consume_event(event)
			}.bind(this))
			
			bus.on('keydown:control-i', function(event) {
				consume_event(event)
			}.bind(this))
			
			bus.on('keydown:control-u', function(event) {
				consume_event(event)
			}.bind(this))
			
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
			initialize_clipboard(bus, editor, sanitizer)
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
			bus.on('action:hyperlink', function() {
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
			bus.emit('feature-did-enable', 'hyperlink', 'Hyperlink')
		}.bind(this))
		
		bus.on('feature:format-strong', function() {
			bus.on('action:strong', function(event, interrupt) {
				toggle_format(editor, 'strong', event)
			}.bind(this))
			bus.unshift('keydown:control-b', function(event, interrupt) {
				bus.emit('action:strong', event)
				interrupt()
			}.bind(this))
			bus.emit('feature-did-enable', 'strong', 'Strong', 'format', 'strong')
		}.bind(this))
		
		bus.on('feature:format-emphasis', function() {
			bus.on('action:emphasis', function(event) {
				toggle_format(editor, 'emphasis', event)
			}.bind(this))
			bus.unshift('keydown:control-i', function(event, interrupt) {
				bus.emit('action:emphasis', event)
				interrupt()
			}.bind(this))
			bus.emit('feature-did-enable', 'emphasis', 'Emphasis', 'format', 'emphasis')
		}.bind(this))
		
		bus.on('feature:format-underline', function() {
			bus.on('action:underline', function(event) {
				toggle_format(editor, 'underline', event)
			}.bind(this))
			bus.unshift('keydown:control-u', function(event, interrupt) {
				bus.emit('action:underline', event)
				interrupt()
			}.bind(this))
			bus.emit('feature-did-enable', 'underline', 'Underline', 'format', 'underline')
		}.bind(this))
		
		bus.on('feature:format-strikethrough', function() {
			bus.on('action:strikethrough', function() {
				toggle_format(editor, 'strikethrough')
			}.bind(this))
			bus.emit('feature-did-enable', 'strikethrough', 'Strikethrough', 'format', 'strikethrough')
		}.bind(this))
		
		bus.on('feature:format-code', function() {
			bus.on('action:code', function() {
				toggle_format(editor, 'code')
			}.bind(this))
			bus.emit('feature-did-enable', 'code', 'Code', 'format', 'code')
		}.bind(this))
		
		bus.on('feature:format-highlight', function() {
			bus.on('action:highlight', function() {
				toggle_format(editor, 'highlight')
			}.bind(this))
			bus.emit('feature-did-enable', 'highlight', 'Highlight', 'format', 'highlight')
		}.bind(this))
		
		bus.on('feature:format-clear', function() {
			bus.on('action:clear-formatting', function() {
				remove_formats(editor, ['hyperlink', 'strong', 'emphasis', 'underline', 'strikethrough', 'highlight'])
			}.bind(this))
			bus.emit('feature-did-enable', 'clear-formatting', 'Clear Formatting')
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
			bus.on('action:paragraph', function() {
				toggle_block(editor, 'p')
			}.bind(this))
			bus.emit('feature-did-enable', 'paragraph', 'Paragraph', 'block', 'p')
		}.bind(this))
		
		bus.on('feature:blocks-heading-1', function() {
			bus.on('action:heading-1', function() {
				toggle_block(editor, 'h1')
			}.bind(this))
			bus.emit('feature-did-enable', 'heading-1', 'Heading 1', 'block', 'h1')
		}.bind(this))
		
		bus.on('feature:blocks-heading-2', function() {
			bus.on('action:heading-2', function() {
				toggle_block(editor, 'h2')
			}.bind(this))
			bus.emit('feature-did-enable', 'heading-2', 'Heading 2', 'block', 'h2')
		}.bind(this))
		
		bus.on('feature:blocks-list-item', function() {
			bus.on('action:list-item', function() {
				toggle_block(editor, 'li')
			}.bind(this))
			bus.emit('feature-did-enable', 'list-item', 'List Item', 'block', 'li')
		}.bind(this))
		
		bus.on('feature:blocks-ordered-list', function() {
			bus.on('action:ordered-list', function() {
				toggle_block(editor, 'ol')
			}.bind(this))
			bus.emit('feature-did-enable', 'ordered-list', 'Ordered List', 'block', 'ol')
		}.bind(this))
		
		bus.on('feature:blocks-unordered-list', function() {
			bus.on('action:unordered-list', function() {
				toggle_block(editor, 'ul')
			}.bind(this))
			bus.emit('feature-did-enable', 'unordered-list', 'Unordered List', 'block', 'ul')
		}.bind(this))
		
		bus.on('feature:blocks-blockquote', function() {
			bus.on('action:blockquote', function() {
				toggle_block(editor, 'blockquote')
			}.bind(this))
			bus.emit('feature-did-enable', 'blockquote', 'Blockquote', 'block', 'blockquote')
		}.bind(this))
		
		bus.on('feature:blocks-indentation', function() {
			bus.on('action:indent', function(event) {
				indent(editor, event)
			}.bind(this))
			bus.on('keydown:tab', function(event) {
				bus.emit('action:indent', event)
			}.bind(this))
			bus.on('keydown:control-]', function(event) {
				bus.emit('action:indent', event)
			}.bind(this))
			bus.emit('feature-did-enable', 'indent', 'Indent')
			bus.on('action:dedent', function(event) {
				dedent(editor, event)
			}.bind(this))
			bus.on('keydown:shift-tab', function(event) {
				bus.emit('action:dedent', event)
			}.bind(this))
			bus.on('keydown:control-[', function(event) {
				bus.emit('action:dedent', event)
			}.bind(this))
			bus.emit('feature-did-enable', 'dedent', 'Dedent')
		}.bind(this))
		
		bus.on('feature:blocks-alignment', function() {
			bus.on('action:align-left', function() {
				align(editor, 'left')
			}.bind(this))
			bus.emit('feature-did-enable', 'align-left', 'Align Left')
			bus.on('action:align-right', function() {
				align(editor, 'right')
			}.bind(this))
			bus.emit('feature-did-enable', 'align-right', 'Align Right')
			bus.on('action:align-center', function() {
				align(editor, 'center')
			}.bind(this))
			bus.emit('feature-did-enable', 'align-center', 'Align Center')
			bus.on('action:align-justify', function() {
				align(editor, 'justify')
			}.bind(this))
			bus.emit('feature-did-enable', 'align-justified', 'Align Justify')
		}.bind(this))
		
		bus.on('feature:atoms', function() {
			initialize_atoms(bus, editor, history)
			initialize_sample_atoms(bus, editor, history)
			initialize_animated_atoms(bus, editor, history)
			initialize_mention_atoms(bus, editor, history)
			initialize_code_atoms(bus, editor, history)
			initialize_hyperlink_atoms(bus, editor, history)
		}.bind(this))
		
		bus.on('feature:cards', function() {
			initialize_cards(bus, editor, history)
			initialize_sample_cards(bus, editor, history)
			initialize_animated_cards(bus, editor, history)
			initialize_image_cards(bus, editor, history)
			initialize_editable_cards(bus, editor, history)
			initialize_design_block_cards(bus, editor, history)
			initialize_code_cards(bus, editor, history)
		}.bind(this))
		
		bus.on('feature:recognizers', function() {
			initialize_recognizers(bus, editor)
		}.bind(this))
		
		bus.on('feature:platform', function() {
			initialize_platform(bus)
		}.bind(this))
		
		bus.on('feature:other', function() {
			bus.on('action:validate', function() {
				this.enforcer.scan(document.querySelector('.content'))
			}.bind(this))
			bus.emit('feature-did-enable', 'validate', 'Validate')
			bus.on('selection-did-change', function(event, editor) {
				logger('system').log('selection-did-change')
				this.debounce_selection_did_change = this.debounce_selection_did_change || debounce(function() {
					this.structure.render()
				}.bind(this), 10)
				this.debounce_selection_did_change()
			}.bind(this))
			bus.on('content-did-change', function(begin, end) {
				logger('system').log('content-did-change')
				this.debounce_content_did_change = this.debounce_content_did_change || debounce(function(begin, end) {
					this.enforcer.scan(begin, end)
					this.structure.render()
				}.bind(this), 10)
				this.debounce_content_did_change(begin, end)
			}.bind(this))
			bus.on('content-valid', function(html) {
				return
			}.bind(this))
			bus.on('content-invalid', function(result) {
				logger('system').log(`content-invalid: ${JSON.stringify(result)}`)
				u('.structure').addClass('invalid')
			}.bind(this))
		}.bind(this))
	}
	
	install_document(document_) {
		
		this.document_ = document_
		this.bus.emit('document-will-install', document_)
		u('.content').empty().append(u(document_.content))
		this.bus.emit('document-did-install', document_)
	}
}
