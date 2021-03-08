
import { Logger } from './logger.js'
import { node_iterator, a_text_node } from './basics.js'

const logger = Logger()

// todo: need to skip atom and card content when sanitizing
// todo: need to resolve nested levels of content

export function sanitize(fragment) {
	
	logger('trace').log('sanitize')
	sanitize_walk(fragment)
	return sanitize_fragment(fragment)
}

export function sanitize_fragment(fragment) {
	
	logger('trace').log('sanitize')
	let result = fragment
	let node = fragment
	let iterator = node_iterator(fragment, node)
	while (node) {
		if (node.hasAttributes && node.hasAttributes()) {
			Array.from(node.attributes).forEach(function(attribute) {
				let name = attribute.nodeName
				let value = attribute.nodeValue
				if (name != 'class') {
					node.removeAttribute(attribute.nodeName)
				}
			})
		}
		if (node.removeAttribute) node.removeAttribute('style')
		if (node.setAttribute) node.setAttribute('woot', 'woot')
		if (node == null) break
		node = iterator.nextNode()
	}
	return result
}

export function sanitize_walk(fragment) {
	
	let parents = [fragment]
	let node = fragment
	let iterator = node_iterator(fragment, node)
	while (node) {
		if (node.nodeType === 1) {
			console.log('element: ' + node.tagName)
			console.log('parent: ' + node.parentNode)
		}
		if (node.nodeType === 3) {
			console.log('text: ' + node.nodeValue)
		} 
		if (node == null) break
		node = iterator.nextNode()
	}
}
