
import { Bus } from './bus.js'
import { Walker } from './walker.js'
import { Logger } from './logger.js'
import { get_selection, set_selection, get_selection_length, normalize_selection } from './selection.js'
import { text_iterator } from './basics.js'

const logger = Logger()

let editable = true

export class Scanner {
	
	constructor(editor) {
		
		this.editor = editor
		this.walker = new Walker()
		this.bus = new Bus()
		this.issues = []
		this.configure(this.walker, this.bus, this.issues)
	}
	
	scan(element) {
		
		logger('scanner').log('walking...')
		editable = true
		this.walker.walk(element)
	}
	
	configure(walker, bus, issues) {
		
		walker.on('text', function(element) {
			if (! editable) return
			if (element.nodeValue.length === 0) {
				bus.emit('detected:text-node-without-content', element)
			} else {
				bus.emit('detected:text-node-with-content', element)
			}
		})
		
		walker.on('text', function(element) {
			if (! editable) return
			if (element.nodeValue.indexOf('\n') === -1) {
				if (! u(element.parentElement).is('span')) {
					bus.emit('detected:text-node-without-span-parent', element)
				}
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('span')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:span-with-no-text-content', element)
				}
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('span')) {
				if (u(element.nextSibling).is(u('span'))) {
					if (Array.from(element.classList).sort().toString() == Array.from(element.nextSibling.classList).sort().toString()) {
						bus.emit('detected:span-requiring-concatenation', element, element.nextSibling)
					}
				}
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('span')) {
				if (element.firstChild.textContent.length === 0) {
					if (element.parentElement && element.parentElement.childNodes.length > 1) {
						bus.emit('detected:empty-span', element, element.nextSibling)
					}
				}
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('p,h1,h2,li')) {
				if (element.childNodes.length === 0) {
					bus.emit('detected:block-element-with-no-span', element)
				}
			}
		})
		
		walker.on('enter', function(element) {
			if (element.matches('.atom')) {
				editable = false
				bus.emit('detected:atom', element)
			}
		})
		
		walker.on('exit', function(element) {
			if (element.matches('.atom')) {
				editable = true
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('.card')) {
				editable = false
				bus.emit('detected:card', element)
			}
		})
		
		walker.on('exit', function(element) {
			if (element.matches('.card')) {
				editable = true
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('[content-editable=false]')) {
				bus.emit('detected:content-editable-false', element)
			}
		})
		
		walker.on('enter', function(element) {
			if (! editable) return
			if (element.matches('article')) {
				bus.emit('detected:other', element)
			}
		})
		
		bus.on('detected:text-node-without-content', function(node) {
			node.textContent = '\u200b'
		})
		
		bus.on('detected:text-node-with-content', function(node) {
			if (node.nodeValue.length > 1) {
				if (node.nodeValue && node.nodeValue.indexOf('\u200b') > -1) {
					let selection = get_selection(this.editor.element)
					let container = selection.head.container
					let offset = selection.head.offset
					node.nodeValue = node.nodeValue.split('\u200b').join('')
					set_selection(this.editor.element, {
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
			let selection = get_selection(this.editor.element)
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
			set_selection(this.editor.element, {
				head: selection.head, 
				tail: selection.tail
			})
			this.editor.emit('content:did-change')
		}.bind(this))
		
		bus.on('detected:empty-span', function(element) {
			logger('scanner').log('detected:empty-span')
			let selection = get_selection(this.editor.element)
			let apply_selection = element.firstChild == selection.head.container
			var iterator = text_iterator(this.editor.element, element.firstChild)
			let next = iterator.nextNode()
			element.remove()
			if (apply_selection) {
				set_selection(this.editor.element, {
					head: { container: next, offset: 0 }, 
					tail: { container: next, offset: 0 }
				})
			}
			this.editor.emit('content:did-change')
		}.bind(this))
		
		bus.on('detected:block-element-with-no-span', function(element) {
			logger('scanner').log('detected:block-element-with-no-span')
			u(element).html('<span>&#x200B;</span>')
		})
		
		bus.on('detected:atom', function(data) {
			logger('scanner').log('detected:atom')
		})
		
		bus.on('detected:card', function(data) {
			logger('scanner').log('detected:card')
		})
		
		bus.on('detected:other', function(data) {
			logger('scanner').log('detected:other')
		})
	}
}

function concatenate() {
	return
}

function scope() {
	return
}

function hoist() {
	return
}

function assign() {
	return
}
