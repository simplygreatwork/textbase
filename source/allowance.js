
import { get_selection } from './selection.js'
import { Logger } from './logger.js'
import { umbrella as u } from '../libraries/umbrella-enhanced.js'

const logger = Logger()

export function allow(key, bus) {
	
	let arguments_ = Array.from(arguments)
	key = arguments_.shift()
	let response = { allow : true }
	bus.emit(`allow:${key}`, response, ...arguments_)
	return response.allow
}

function roadmap(editor) {
	
	let selection = get_selection(editor)
	let context = selection
	allow('insert-character', editor, context)
	allow('insert-string', editor, context)
	allow('insert-atom', editor, context)
	allow('insert-atom:mention', editor, context)
	allow('insert-card', editor, context)
	allow('insert-card:code', editor, context)
	allow('delete-character', editor, context)
	allow('delete-block', editor, context)
	allow('delete-content', editor, context)
	allow('delete-atom', editor, context)
	allow('delete-atom:mention', editor, context)
	allow('delete-card', editor, context)
	allow('delete-card:code', editor, context)
	allow('format:underline', editor, context)
	allow('toggle-block:h2', editor, context)
	allow('cut', editor, context)
	allow('copy', editor, context)
	allow('paste', editor, context)
	allow('paste:text/html', editor, context)
	allow('paste:text/plain', editor, context)
	allow('undo', editor, context)
	allow('redo', editor, context)
}
