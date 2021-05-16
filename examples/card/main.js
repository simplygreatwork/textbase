
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import * as cards from '../../source/features/cards.js'
import * as example_cards from './card.js'

let bus = new Bus()
let system = new System(bus)
let storage = new Storage(bus)
bus.on('storage-did-load', function(document_) {
	system.install_document(document_)
})
bus.on('system-ready', function() {
	storage.load('./examples/card/content.html')
})
system.initialize()
cards.initialize(system)
example_cards.initialize(system)
