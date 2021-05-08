
import { Logger } from '.source/logger.js'

const logger = Logger()

export function can(key) {
	
	let data = {}
	bus.emit(key, data)
	return data.result
}
