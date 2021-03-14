
export let a_block_element = 'div,p,h1,h2,h3,ul,ol,li,blockquote'
export let an_inline_element = 'span,a'

export function node_iterator(element, node, filter) {
	
	filter = filter || function(node) {
		return true
	}
	let walker = document.createTreeWalker(element, NodeFilter.SHOW_ALL, function(node) {
		return filter(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
	}, false)
	walker.currentNode = node
	return walker
}

export function element_iterator(element, node) {
	
	return node_iterator(element, node, function(node_) {
		return node_.nodeType === 1
	})
}

export function text_iterator(element, node) {
	
	return node_iterator(element, node, function(node_) {
		return node_.nodeType === 3
	})
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

export function find_previous_block(element, node) {
	
	let block = u(node).closest(u(a_block_element))
	let iterator = element_iterator(element, block.first())
	return iterator.previousNode()
}

export function find_previous_element(element, node) {
	
	let iterator = text_iterator(element, node)
	return iterator.previousNode().parentElement
}

export function a_text_node(node) {
	return node.nodeType === 3
}

export function an_element_node(node) {
	return node.nodeType === 1
}

export function a_span_node(node) {			// fixme
	return 'span'
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

export function iterate_characters(element, fn) {
	
	let node = editor.element
	let iterator = node_iterator(editor.element, node)
	while (node) {
		if (node instanceof Text) {
			for (let index in node.nodeValue) {
				let char = node.nodeValue[index]
				if (char != '\t') {
					fn(char, position, node, index)
					position = position + 1
				}
			}
		} else if (node instanceof HTMLBRElement) {
			fn('\n', position, node, 0)
			position = position + 1
		}
		node = iterator.nextNode()
	}
}
