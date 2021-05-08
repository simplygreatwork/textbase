
import { Logger } from '.source/logger.js'

const logger = Logger()

export function can() {
	
	let data = {}
	bus.emit(`can:${key}`, ...Array.from(arguments).slice(1))
	return data.result
}

function roadmap(selection) {
	
	let context = selection
	can('insert-character', context)
	can('insert-string', context)
	can('insert-atom', context)
	can('insert-atom:mention', context)
	can('insert-card', context)
	can('insert-card:code', context)
	can('delete-character', context)
	can('delete-block', context)
	can('delete-content', context)
	can('delete-atom', context)
	can('delete-atom:mention', context)
	can('delete-card', context)
	can('delete-card:code', context)
	can('format:underline', context)
	can('toggle-block:h2', context)
	can('cut', context)
	can('copy', context)
	can('paste', context)
	can('paste:text/html', context)
	can('paste:text/plain', context)
	can('undo', context)
	can('redo', context)
}
