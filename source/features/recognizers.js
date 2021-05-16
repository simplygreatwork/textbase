
import { a_text_node } from '../basics.js'
import { get_selection } from '../selection.js'
import { umbrella as u } from '../../libraries/umbrella-enhanced.js'

export function initialize_recognizers(system) {
	
	let [bus, editor, history] = [system.bus, system.editor, system.history]
	
	bus.on('keydown:shift-space', function(event) {
		let selection = get_selection(editor)
		let node = u(selection.head.container)
		if (node.is(a_text_node)) {
			console.log('shift-space detected in text node by first recognizer: ' + node.text())
		}
	}.bind(this))
	
	bus.on('keydown:shift-space', function(event) {
		let selection = get_selection(editor)
		let node = u(selection.head.container)
		if (node.is(a_text_node)) {
			console.log('shift-space detected in text node by second recognizer: ' + node.text())
		}
	}.bind(this))
	
	bus.on('keydown:shift-space', function(event) {
		let selection = get_selection(editor)
		let node = u(selection.head.container)
		if (node.is(a_text_node)) {							// todo: need to swallow the key down event
			console.log('node.text: ' + node.text())
		}
	}.bind(this))
}
