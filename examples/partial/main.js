
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import * as formats from '../../source/features/formats.js'
import * as blocks from '../../source/features/blocks.js'

let bus = new Bus()
let system = new System(bus)
let storage = new Storage(bus)
bus.on('storage-did-load', function(document_) {
	system.install_document(document_)
})
bus.on('system-ready', function() {
	storage.load('./examples/partial/content.html')
})
system.initialize()
formats.initialize(bus, system.editor, system.history, ['strong', 'emphasis'])
blocks.initialize(bus, system.editor, system.history, ['paragraph', 'heading-1', 'heading-2'])
