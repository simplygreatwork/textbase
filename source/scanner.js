
import { an_element_node, a_text_node } from './basics.js'
import { zero_width_whitespace } from './basics.js'
import { text_iterator } from './basics.js'
import { get_selection, set_selection, get_selection_length, normalize_selection } from './selection.js'
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'

const logger = Logger()

export class Scanner {
	
	constructor(editor) {
		
		this.editor = editor
		this.walker = new Walker()
		this.bus = new Bus()
		this.configure(this.walker, this.bus)
	}
	
	scan(begin, end) {
		
		logger('scanner').log('walking...')
		this.walker.walk(this.editor.element, begin, end)
	}
	
	configure(walker, bus) {
		
		walker.on('text', function(element) {
			if (! is_editable(element)) return
			if (element.nodeValue.length === 0) {
				bus.emit('detected:text-node-without-content', element)
			} else {
				bus.emit('detected:text-node-with-content', element)
			}
		})
		
		walker.on('text', function(element) {
			if (! is_editable(element)) return
			if (element.nodeValue.indexOf('\n') === -1) {
				if (! u(element.parentElement).is('span')) {
					bus.emit('detected:text-node-without-span-parent', element)
				}
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('span')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:span-with-no-text-content', element)
				}
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('span')) {
				if (u(element.nextSibling).is(u('span'))) {
					if (Array.from(element.classList).sort().toString() == Array.from(element.nextSibling.classList).sort().toString()) {
						bus.emit('detected:span-requiring-concatenation', element, element.nextSibling)
					}
				}
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('span')) {
				if (element.firstChild && element.firstChild.textContent.length === 0) {
					if (element.parentElement && element.parentElement.childNodes.length > 1) {
						bus.emit('detected:empty-span', element, element.nextSibling)
					}
				}
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('p,h1,h2,li')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:block-element-with-no-span', element)
				}
			}
		})
		
		walker.on('element', function(element) {
			if (element.matches('.atom')) {
				bus.emit('detected:atom', element)
			}
		})

		walker.on('element', function(element) {
			if (element.matches('.card')) {
				bus.emit('detected:card', element)
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('[content-editable=false]')) {
				bus.emit('detected:content-editable-false', element)
			}
		})
		
		walker.on('element', function(element) {
			if (! is_editable(element)) return
			if (element.matches('article')) {
				bus.emit('detected:other', element)
			}
		})
		
		bus.on('detected:text-node-without-content', function(node) {
			node.textContent = zero_width_whitespace
		})
		
		bus.on('detected:text-node-with-content', function(node) {
			if (node.nodeValue.length > 1) {
				if (node.nodeValue && node.nodeValue.indexOf(zero_width_whitespace) > -1) {
					let selection = get_selection(this.editor)
					let container = selection.head.container
					let offset = selection.head.offset
					node.nodeValue = node.nodeValue.split(zero_width_whitespace).join('')
					set_selection(this.editor, {
						head: { container: container, offset: node.nodeValue.length }, 
						tail: { container: container, offset: node.nodeValue.length }
					})
				}
			}
		}.bind(this))
		
		bus.on('detected:text-node-without-span-parent', function(node) {
			logger('scanner').log('detected:text-node-without-span-parent')
			logger('scanner').log('text: ' + u(node).text())
		})
		
		bus.on('detected:span-with-no-text-content', function(data) {
			logger('scanner').log('detected:span-with-no-text-content')
		})
		
		bus.on('detected:span-requiring-concatenation', function(element, next_element) {
			logger('scanner').log('detected:span-requiring-concatenation')
			let selection = get_selection(this.editor)
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
				set_selection(this.editor, {
					head: selection.head,
					tail: selection.tail
				})
			}
			this.editor.emit('content:did-change', element.previousSibling, element.nextSibling)
		}.bind(this))
		
		bus.on('detected:empty-span', function(element) {
			logger('scanner').log('detected:empty-span')
			let selection = get_selection(this.editor)
			let apply_selection = element.firstChild == selection.head.container
			let iterator = text_iterator(this.editor.element, element.firstChild)
			let next = iterator.nextNode()
			element.remove()
			if (apply_selection) {
				set_selection(this.editor, {
					head: { container: next, offset: 0 }, 
					tail: { container: next, offset: 0 }
				})
			}
			this.editor.emit('content:did-change', next.previousSibling, next.nextSibling)
		}.bind(this))
		
		bus.on('detected:block-element-with-no-span', function(element) {
			logger('scanner').log('detected:block-element-with-no-span')
			u(element).html('<span>&#x200B;</span>')
			this.editor.emit('content:did-change')
		}.bind(this))
		
		bus.on('detected:atom', function(data) {
			logger('scanner').log('detected:atom')
		}.bind(this))
		
		bus.on('detected:card', function(data) {
			logger('scanner').log('detected:card')
		}.bind(this))
		
		bus.on('detected:other', function(data) {
			logger('scanner').log('detected:other')
		}.bind(this))
	}
}

function is_editable(node) {
	
	node = u(node)
	if (node.is(an_element_node) && node.is('.atom')) return false
	if (node.is(an_element_node) && node.closest('.atom').length > 0) return false
	if (node.is(a_text_node) && node.parent().closest('.atom') && node.parent().closest('.atom').length  > 0) return false
	if (node.is(an_element_node) && node.is('.card')) return false
	if (node.is(an_element_node) && node.closest('.card').length > 0) return false
	if (node.is(a_text_node) && node.parent().closest('.card') && node.parent().closest('.card').length  > 0) return false
	return true
}
