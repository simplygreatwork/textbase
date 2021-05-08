
import { Logger } from './../logger.js'

const logger = Logger()

export function dump(bus) {
	
	let count = 0
	let channels = bus.channels
	Object.keys(channels).forEach(function(context) {
		Object.keys(channels[context]).forEach(function(channel) {
			count++
			let size = channels[context][channel].length
			console.log(`bus channel: ${context}/${channel}[${size}]`)
			if (false) channels[context][channel].forEach(function(fn) {
				console.log(`fn: ${fn}`)
			}.bind(this))
		}.bind(this))
	}.bind(this))
	console.log(`total bus channels: ${count}`)
}

export function dump_2(bus) {
	
	let index = {}
	let channels = bus.channels
	Object.keys(channels).forEach(function(context) {
		Object.keys(channels[context]).forEach(function(key) {
			index[key] = index[key] || {}
			index[key][context] = index[key][context] || 0
			index[key][context]++
			// let size = channels[context][channel].length
			// console.log(`bus channel: ${context}/${channel}[${size}]`)
			// if (false) channels[context][channel].forEach(function(fn) {
			// 	console.log(`fn: ${fn}`)
			// }.bind(this))
		}.bind(this))
	}.bind(this))
	let count = 0
	Object.keys(index).forEach(function(key) {
		count++
		let size = 0
		let array = []
		array.push(`bus channel: ${channel} `)
		Object.keys(index[key]).forEach(function(key) {
			size++
			Object.keys(index[key][context]).forEach(function(context) {
				size++
			}.bind(this))
		}.bind(this))
		array.push(`[${size}]`)
		console.log(`bus channel: ${channel}[${size}] `)
	}.bind(this))
	
	
}
