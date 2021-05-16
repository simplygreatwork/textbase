
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import * as atoms from '../../source/features/atoms.js'
import * as example_atoms from './atom.js'

let bus = new Bus()
let system = new System(bus)
let storage = new Storage(bus)
bus.on('storage-did-load', function(document_) {
	system.install_document(document_)
})
bus.on('system-ready', function() {
	storage.load('./examples/atom/content.html')
})
system.initialize()
atoms.initialize(system)
example_atoms.initialize(system)
