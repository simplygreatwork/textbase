
import { an_element_node, a_text_node } from './basics.js'
import { zero_width_whitespace } from './basics.js'
import { text_iterator } from './basics.js'
import { is_editable_node } from './basics.js'
import { get_selection, set_selection } from './selection.js'
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Enforcer {
	
	constructor(bus, editor) {
		
		this.bus = new Bus()
		this.editor = editor
		this.walker = new Walker()
		this.configure(this.walker, this.bus, this.editor)
	}
	
	scan(begin, end) {
		
		logger('enforcer').log('walking...')
		end = end ? end.nextSibling : end
		this.walker.walk(this.editor.element, begin, end)
	}
	
	configure(walker, bus, editor) {
		
		walker.on('text', function(node) {
			if (is_editable_node(node)) {
				walker.emit('text-editable', node)
			}
		})
		
		walker.on('text-editable', function(node) {
			if (node.nodeValue.length === 0) {
				bus.emit('detected:text-node-without-content', node)
			} else {
				bus.emit('detected:text-node-with-content', node)
			}
		})
		
		walker.on('text-editable', function(node) {
			if (node.nodeValue.indexOf('\n') === -1) {
				if (! u(node.parentElement).is('span')) {
					bus.emit('detected:text-node-without-span-parent', node)
				}
			}
		})
		
		walker.on('element', function(element) {
			if (is_editable_node(element)) {
				walker.emit('element-editable', element)
			}
		})
		
		walker.on('element-editable', function(element) {
			if (element.matches('span')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:span-with-no-text-content', element)
				}
			}
		})
		
		walker.on('element-editable', function(element) {
			let [a, b] = [element, element.nextSibling]
			if (a && a.matches && a.matches('span')) {
				if (b && b.matches && b.matches('span')) {
					if (Array.from(a.classList).sort().toString() == Array.from(b.classList).sort().toString()) {
						bus.emit('detected:span-requiring-concatenation', a, b)
					}
				}
			}
		})
		
		walker.on('element-editable', function(element) {
			if (element.matches('span')) {
				if (element.firstChild && element.firstChild.textContent.length === 0) {
					if (element.parentElement && element.parentElement.childNodes.length > 1) {
						bus.emit('detected:empty-span', element, element.nextSibling)
					}
				}
			}
		})
		
		walker.on('element-editable', function(element) {
			if (element.matches('p,h1,h2,li')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:block-element-with-no-span', element)
				}
			}
		})
		
		bus.on('detected:text-node-without-content', function(node) {
			node.textContent = zero_width_whitespace
		})
		
		bus.on('detected:text-node-with-content', function(node) {
			if (node.nodeValue.length > 1) {
				if (node.nodeValue && node.nodeValue.indexOf(zero_width_whitespace) > -1) {
					let selection = get_selection(editor)
					let container = selection.head.container
					let offset = selection.head.offset
					node.nodeValue = node.nodeValue.split(zero_width_whitespace).join('')
					set_selection(editor, {
						head: { container: container, offset: node.nodeValue.length }, 
						tail: { container: container, offset: node.nodeValue.length }
					})
				}
			}
		})
		
		bus.on('detected:text-node-without-span-parent', function(node) {
			logger('scanner').log('detected:text-node-without-span-parent')
			logger('scanner').log('text: ' + u(node).text())
		})
		
		bus.on('detected:span-with-no-text-content', function(data) {
			logger('scanner').log('detected:span-with-no-text-content')
		})
		
		bus.on('detected:span-requiring-concatenation', function(element, next_element) {
			logger('scanner').log('detected:span-requiring-concatenation')
			let selection = get_selection(editor)
			if (selection && selection.head) {
				if (selection.head.container == next_element.firstChild) {
					selection.head.container = element.firstChild
					selection.head.offset = selection.head.offset + element.firstChild.textContent.length
				}
				if (selection.tail.container == next_element.firstChild) {
					selection.tail.container = element.firstChild
					selection.tail.offset = element.firstChild.textContent.length + selection.tail.offset
				}
				element.firstChild.textContent = element.firstChild.textContent + next_element.firstChild.textContent
				next_element.remove()
				set_selection(editor, {
					head: selection.head,
					tail: selection.tail
				})
			}
			bus.emit('content-did-change', element.previousSibling, element)
		})
		
		bus.on('detected:empty-span', function(element) {				// issue: should not be removing empty spans? (insert zero width whitespace)
			logger('scanner').log('detected:empty-span')
			let selection = get_selection(editor)
			let apply_selection = selection && selection.head ? element.firstChild == selection.head.container : false
			let iterator = text_iterator(editor.element, element.firstChild)
			let next = iterator.nextNode()
			element.remove()
			if (apply_selection) {
				set_selection(editor, {
					head: { container: next, offset: 0 }, 
					tail: { container: next, offset: 0 }
				})
			}
			bus.emit('content-did-change', next.previousSibling, next)
		})
		
		bus.on('detected:block-element-with-no-span', function(element) {
			logger('scanner').log('detected:block-element-with-no-span')
			u(element).html(`<span>&#x200B;</span>`)
			u(element).html(`<span>${zero_width_whitespace}</span>`)
			bus.emit('content-did-change')											// todo: ('content-did-change', element, element)
		})
	}
}
