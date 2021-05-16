
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { selection_edge, selection_each_node, selection_each_text, selection_each_block, normalize_selection } from '../selection.js'
import { initialize_pseudolinks, detect_pseudolinks } from './pseudolinks.js'
import { Logger } from '../logger.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

const logger = Logger()

export function initialize(system, formats) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	formats = formats || ['pseudolink', 'strong', 'emphasis', 'underline', 'strikethrough', 'highlight', 'clear']
	
	bus.on('feature:format-pseudolink', function() {
		initialize_pseudolinks(system)
		detect_pseudolinks(system)
		bus.on('action:pseudolink', function() {
			let result = window.prompt('Enter a URL', 'http://github.com')
			if (result) toggle_format_with_data(editor, 'pseudolink', { href: result })
		}.bind(this))
		bus.on('pseudolink:clicked', function(href, event) {
			if (event && event.ctrlKey) {
				window.open(href)
			} else {
				window.location.href = href
			}
		}.bind(this))
		bus.emit('feature-did-enable', 'pseudolink', 'Pseudo Link')
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
	
	bus.on('format-did-apply', function(event) {
		history.capture()
	}.bind(this))
	
	bus.on('format-did-remove', function(event) {
		history.capture()
	}.bind(this))
	
	formats.forEach(function(format) {
		bus.emit(`feature`, `format-${format}`)
	})
}

export function toggle_format(editor, format, event) {
	
	logger('trace').log('toggle_format')
	toggle_format_with_data(editor, format, null, event)
}

export function toggle_format_with_data(editor, format, data, event) {
	
	logger('trace').log('toggle_format_with_data')
	if (event && event.preventDefault) event.preventDefault()
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	selection = get_selection(editor)
	if (data) apply_data(editor, selection, data)
	let apply = should_apply_format(editor, selection, format)
	if (apply) apply_format(editor, selection, format)
	else remove_format(editor, selection, format)
}

function should_apply_format(editor, selection, format) {
	
	let result = false
	selection_each_text(editor, selection, function(node, index) {
		if (! u(node).parent().hasClass(format)) result = true
	})
	return result
}

function apply_data(editor, selection, data) {
	
	selection_each_text(editor, selection, function(node, index) {
		let parent = u(node).parent()
		Object.keys(data).forEach(function(each) {
			parent.data(each, data[each])
		})
	})
}

function apply_format(editor, selection, format) {
	
	selection_each_text(editor, selection, function(node, index) {
		u(node).parent().addClass(format)
	})
	editor.emit('format-did-apply', format)
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

function remove_format(editor, selection, format) {
	
	selection_each_text(editor, selection, function(node, index) {
		u(node).parent().removeClass(format)
	})
	editor.emit('format-did-remove', format)
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function remove_formats(editor, formats) {
	
	logger('trace').log('remove_formats')
	let selection = get_selection(editor)
	selection_edge(editor, selection)
	selection = get_selection(editor)
	selection_each_text(editor, selection, function(node) {
		formats.forEach(function(each) {
			u(node).parent().removeClass(each)
		})
	})
	formats.forEach(function(format) {
		editor.emit('format-did-remove', format)
	})
	editor.emit('content-did-change', selection.head.container, selection.tail.container)
}

export function find_active_formats(editor) {
	
	logger('trace').log('find_active_formats')
	let result = new Set()
	let selection = get_selection(editor)
	selection_each_text(editor, selection, function(each) {
		result = new Set(...result, Array.from(each.parentNode.classList))
	})
	return Array.from(result)
}

export function find_applicable_formats(editor) {
	
	let selection = get_selection(editor)
	return []
}
