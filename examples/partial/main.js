
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import { Logger } from '../../source/logger.js'

import * as formats from '../../source/features/formats.js'
import * as blocks from '../../source/features/blocks.js'

const logger = Logger()

export class Application {
	
	constructor() {
		
		let bus = new Bus()
		let system = new System(bus)
		let storage = new Storage(bus)
		bus.on('ready', function() {
			bus.on('storage-did-load', function(document_) {
				system.install_document(document_)
			})
			storage.load({
				path: './examples/partial/content.html'
			})
		}.bind(this))
		system.initialize()
		this.configure(bus, system.editor, system.history)
	}
	
	configure(bus, editor, history) {
		
		formats.initialize(bus, editor, history, ['strong', 'emphasis'])
		blocks.initialize(bus, editor, history, ['paragraph', 'heading-1', 'heading-2'])
	}
}

new Application()
