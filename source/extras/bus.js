
import { Logger } from './../logger.js'

const logger = Logger()

export function dump(bus) {
	
	let index = {}
	let channels = bus.channels
	Object.keys(channels).forEach(function(context) {
		Object.keys(channels[context]).forEach(function(key) {
			index[key] = index[key] || {}
			index[key][context] = index[key][context] || channels[context][key]
		})
	})
	let count = 0
	let sorted = Array.from(Object.keys(index))
	sorted.sort()
	sorted.forEach(function(key) {
		count++
		let size = 0
		let array = []
		array.push(`${key}`)
		Object.keys(index[key]).forEach(function(context) {
			array.push(`(${context}:${index[key][context].length})`)
			size = size + index[key][context].length
			index[key][context].forEach(function(fn) {
				if (false) console.log(`source: ${fn}`)
			})
		})
		array.push(`(total:${size})`)
		console.log(array.join(' '))
	})
	console.log(`total bus channels: ${count}`)
}
