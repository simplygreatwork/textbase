
import { Bus } from './bus.js'
import { Logger } from './logger.js'

const logger = Logger()

export let a_block_element = 'div,p,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote'
export let an_inline_element = 'span,a'
export let zero_width_whitespace = '\u200b'

export function an_element_node(node) {
	return node.nodeType === 1
}

export function a_text_node(node) {
	return node.nodeType === 3
}

export function node_iterator(element, from, filter) {
	
	filter = filter || function(node) { return true }
	let walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, function(node) {
		return filter(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
	}, false)
	walker.currentNode = from
	return walker
}

export function element_iterator(element, from) {
	
	return node_iterator(element, from, function(node) {
		return an_element_node(node)
	})
}

export function text_iterator(element, from) {
	
	return node_iterator(element, from, function(node) {
		return a_text_node(node)
	})
}

export function is_editable_node(node) {
	
	node = u(node)
	if (node.is(a_text_node)) node = node.parent()
	if (node.attr('contenteditable') === 'false') return false
	if (node.closest('[contenteditable]').attr('contenteditable') === 'false') return false
	return true
}

export function find_previous_inline_sibling(editor, selection) {
	
	let iterator = text_iterator(editor.element, selection.head.container)
	let previous = iterator.previousNode()
	if (u(previous).parent().is(an_inline_element)) {
		if (u(selection.head.container).parent().parent().first() == u(previous).parent().parent().first()) {
			return previous
		}
	}
}

export function find_previous_element(element, node) {
	
	let iterator = text_iterator(element, node)
	return iterator.previousNode().parentElement
}

export function find_previous_block(element, node) {
	
	let block = u(node).closest(u(a_block_element))
	let iterator = element_iterator(element, block.first())
	return iterator.previousNode()
}

export function find_next_block(element, node) {
	
	let block = u(node).closest(u(a_block_element))
	let iterator = element_iterator(element, block.first())
	return iterator.nextNode()
}

export function find_next_editable_text_node(editor, from) {
	
	let iterator = text_iterator(editor.element, from)
	let node = iterator.nextNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) {
			if (is_editable_node(node)) {
				return node
			}
		}
		node = iterator.nextNode()
	}
	return node
}

export function find_previous_editable_text_node(editor, from) {
	
	let iterator = text_iterator(editor.element, from)
	let node = iterator.previousNode()
	while (node) {
		if (node.nodeValue.trim().length > 0) {
			if (is_editable_node(node)) {
				return node
			}
		}
		node = iterator.previousNode()
	}
	return node
}

export function is_alphanumeric(keycode) {
	
	if (
		between(keycode, 65, 90) ||
		between(keycode, 48, 57) ||
		between(keycode, 186, 222) ||
		between(keycode, 96, 111)
	) {
		return true
	} else {
		return false
	}
}

export function between(keycode, a, b) {
	
	const min = Math.min(a, b)
	const max = Math.max(a, b)
	return keycode >= min && keycode <= max
}

export function consume_event(event) {
	
	if (! event) return
	if (! event instanceof Event) throw Error(`Expected argument type "Event" in function "consume_event"`)
	if (event.stopPropagation) event.stopPropagation()
	if (event.preventDefault) event.preventDefault()
}

export function debounce(fn, timeout = 300) {
	
	let timer
	return function(...args) {
		clearTimeout(timer)
		timer = setTimeout(function() {
			fn.apply(this, args)
		}, timeout)
	}
}

export function invoke_later(fn, ms) {
	
	window.setTimeout(fn, ms || 1)
}

export function decode_entities(html) {
	
	let textarea = document.createElement('textarea')
	textarea.innerHTML = html
	return textarea.value
}

export function get_clipboard_data(event) {
	
	if (! event) return window.clipboardData
	return event.clipboardData || window.clipboardData
}

export function inject_stylesheet(bus, basis) {
	
	let href = u(basis).attr('href')
	bus.emit(`resource-will-load`, href)
	bus.emit(`resource-will-load:${href}`)
	basis = u(basis).first()	
	let link = document.createElement('link')
	Object.keys(basis.attributes).forEach(function(i) {
		link.setAttribute(basis.attributes[i].name, basis.attributes[i].value)
	})
	link.addEventListener('load', function(event) {
		bus.emit(`resource-did-load`, href)
		bus.emit(`resource-did-load:${href}`)
	})
	document.head.appendChild(link)
}

export function inject_script(bus, basis) {
	
	let src = u(basis).attr('src')
	bus.emit(`resource-will-load`, src)
	bus.emit(`resource-will-load:${src}`)
	basis = u(basis).first()
	let script = document.createElement('script')
	Object.keys(basis.attributes).forEach(function(i) {
		script.setAttribute(basis.attributes[i].name, basis.attributes[i].value)
	})
	script.addEventListener('load', function(event) {
		bus.emit(`resource-did-load`, src)
		bus.emit(`resource-did-load:${src}`)
	})
	document.body.appendChild(script)
}

export function load_resources(resources, then) {
	
	let bus = new Bus()
	let loading = new Set()
	bus.on('resource-will-load', function(resource) {
		logger('resources').log(`resource-will-load:${resource}`)
		loading.add(resource)
	})
	bus.on('resource-did-load', function(resource) {
		invoke_later(function() {														// ensure that the loading set will queue up instead of deflating too soon
			logger('resources').log(`resource-did-load:${resource}`)
			loading.delete(resource)
			if (loading.size === 0) then()
		})
	})
	resources(bus)
}
