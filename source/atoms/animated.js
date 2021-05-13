
import { insert_atom } from '../features/atoms.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize(system) {
	
	let [ bus, editor, history ] = [ system.bus, system.editor, system.history ]
	
	bus.on('action:atom-animated', function() {
		insert_atom(editor, `
			<span class="atom" data-atom-type="animated"></span>
		`)
	}.bind(this))
	
	bus.on('atom-will-enter:animated', function(atom) {
		u(atom).text('Animated atom: ' + Math.random())
	}.bind(this))
	
	bus.on('atom-did-enter:animated', function(atom) {
		if (atom.id_) window.clearInterval(atom.id_)
		atom.id_ = window.setInterval(function() {
			u(atom).text('Animated atom: ' + Math.random())
		}, 500)
	}.bind(this))
	
	bus.on('atom-will-exit:animated', function(atom) {
		window.clearInterval(atom.id_)
	}.bind(this))
	
	bus.on('atom-did-exit:animated', function(atom) {
		return
	}.bind(this))
	
	bus.emit('feature-did-enable', 'atom-animated', 'Atom: Animated')
}
