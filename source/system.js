
import { Bus } from './bus.js'
import { Editor } from './editor.js'
import { History } from './history.js'
import { Toolbar } from './toolbar.js'
import { Enforcer } from './enforcer.js'
import { Sanitizer } from './sanitizer.js'
import { Structure } from './structure.js'
import { a_block_element, consume_event, debounce, invoke_later } from './basics.js'
import { get_selection, set_selection, select_all, selection_to_string } from './selection.js'
import { skip_left_over_zero_width_whitespace, skip_right_over_zero_width_whitespace } from './navigation.js'
import { extend_selection_right, extend_selection_left } from './navigation.js'
import { extend_selection_down, extend_selection_up } from './navigation.js'
import { initialize_clipboard } from './clipboard.js'
import { initialize_platform } from './platform.js'
import { initialize_recognizers } from './features/recognizers.js'
import { serialize } from './serialize.js'
import { dump as dump_bus } from './extras/bus.js'
import { Logger } from './logger.js'

const logger = Logger(['trace-off', 'bus-off', 'resources-off', 'system-off', 'editor-off', 'history-off', 'toolbar-off', 'enforcer-off', 'sanitizer-off', 'clipboard-off', 'formats-off'])

export class System {
	
	constructor(bus, features) {
		
		this.bus = bus || new Bus()
		this.selectors = this.selectors || {}
		this.selectors.editor = '.editor'
		this.selectors.toolbar = '.toolbar'
		this.selectors.structure = '.structure'
		this.features = features || [
			'essentials',
			'other',
			'recognizers',
			'platform'
		]
	}
	
	initialize() {
		
		this.editor = new Editor(this.bus, document.querySelector(this.selectors.editor))
		this.history = new History(this.bus, document.querySelector(this.selectors.editor))
		this.toolbar = new Toolbar(this.bus, document.querySelector(this.selectors.toolbar))
		this.structure = new Structure(this.bus, document.querySelector(this.selectors.structure), this.editor)
		this.enforcer = new Enforcer(this.bus, this.editor)
		this.sanitizer = new Sanitizer(this.bus)
		this.initialize_features(this.bus)
		this.offer_features(this.bus, this.editor, this.history, this.toolbar, this.enforcer, this.sanitizer, this.structure)
		this.enable_features(this.features, this.bus)
		if (true) sanitizer_test(this.sanitizer)
	}
	
	initialize_features(bus) {
		
		bus.on('feature', function(feature) {
			bus.emit(`feature:${feature}`)
		})
		
		let enabling = new Set()
		bus.on('feature-will-enable', function(feature) {
			enabling.add(feature)
		})
		
		bus.on('feature-did-enable', function(feature) {
			invoke_later(function() {												// ensure that the enabling set will queue up instead of deflating too soon
				enabling.delete(feature)
				if (enabling.size === 0) bus.emit('system-ready')
			})
		})
	}
	
	enable_features(features, bus) {
		
		features.forEach(function(key) {
			this.enable_feature(key)
		}.bind(this))
	}
	
	enable_feature(feature) {
		
		let bus = this.bus
		bus.emit(`feature`, feature)
	}
	
	offer_features(bus, editor, history, toolbar, enforcer, sanitizer, structure) {
		
		let features = {}
		bus.on('feature', function(name) {
			if (features[name]) throw Error(`The feature "${name}" cannot be enabled a second time.`)
			features[name] = true
		}.bind(this))
		
		bus.on('feature:essentials', function() {
			this.enable_feature('toolbar')
			this.enable_feature('documents')
			this.enable_feature('history')
			this.enable_feature('basics')
			this.enable_feature('clipboard')
		}.bind(this))
		
		bus.on('feature:toolbar', function() {
			bus.on('feature-did-enable', function(name, label, kind, value) {
				if (! name && ! label) return
				let element = u(`<button data-action="${name}">${label}</button>`)
				if (kind) element.data(kind, value)
				toolbar.append(element.first())
			}.bind(this))
		}.bind(this))
		
		bus.on('feature:documents', function() {
			bus.on('document-did-install', function(document_) {
				logger('system').log('document-did-install')
				this.enforcer.scan(document.querySelector('.editor'))
				this.history.enable()
				this.structure.render()
				if (false) dump_bus(bus)
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
				editor.request_to_insert_character(event)
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
			
			bus.emit('feature-will-enable', 'undo', 'Undo')			// will force system ready state, in the case that no other resources require loading
			
			bus.on('action:undo', function() {
				this.history.undo(event)
			}.bind(this))
			
			bus.on('keydown:control-z', function(event) {
				bus.emit('action:undo', event)
			}.bind(this))
			
			bus.emit('feature-did-enable', 'undo', 'Undo')
			bus.emit('feature-will-enable', 'redo', 'Redo')
			
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
		
		bus.on('feature:recognizers', function() {
			initialize_recognizers(this)
		}.bind(this))
		
		bus.on('feature:platform', function() {
			initialize_platform(bus)
		}.bind(this))
		
		bus.on('feature:other', function() {
			bus.on('action:validate', function() {
				this.enforcer.scan(document.querySelector('.editor'))
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
		u('.editor').empty().append(u(document_.content))
		this.bus.emit('document-did-install', document_)
	}
}

function sanitizer_test(sanitizer) {
	
	logger('sanitizer').log('sanitized: ')
	logger('sanitizer').log(sanitizer.sanitize(`
		top-text
		<p>
			p-text
			<span>p-span-text</span>
			<a href="http://github.com">
				<span>p-a-span-text</span>
				<span>p-a-span-text</span>
			</a>
			<code>
				<span>p-code-span-text</span>
			</code>
		</p>
		<omit>
			omit-text
			<h1>omit-h1-text</h1>
			omit-text
			<span>omit-span-text</span>
			<b>omit-bold-text</b>
			<span>omit-span-text</span>
		</omit>
		<h1>h1-text</h1>
		<h2>h2-text</h2>
		<li><b>li-text</b></li>
		<ul>
			<li>li-text</li>
			<li>li-text</li>
		</ul>
		<script></script>
		<table></table>
		<b>bold-text</b>
		<i>italic-text</i>
		<div contentEditable="false">
			<script></script>
			<table></table>
			<b>div-bold-text</b>
			<i>div-italic-text</i>
		</div>
	`))
}
