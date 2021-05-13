
import { Bus } from '../../source/bus.js'
import { System } from '../../source/system.js'
import { Storage } from '../../source/storage.js'
import * as formats from '../../source/features/formats.js'
import * as blocks from '../../source/features/blocks.js'
import * as atoms from '../../source/features/atoms.js'
import * as sample_atoms from '../../source/atoms/sample.js'
import * as animated_atoms from '../../source/atoms/animated.js'
import * as mention_atoms from '../../source/atoms/mention.js'
import * as code_atoms from '../../source/atoms/code.js'
import * as hyperlink_atoms from '../../source/atoms/hyperlink.js'
import * as cards from '../../source/features/cards.js'
import * as sample_cards from '../../source/cards/sample.js'
import * as animated_cards from '../../source/cards/animated.js'
import * as editable_cards from '../../source/cards/editable.js'
import * as design_block_cards from '../../source/cards/design-block.js'
import * as image_cards from '../../source/cards/image.js'
import * as code_cards from '../../source/cards/code.js'

let bus = new Bus()
let system = new System(bus)
let storage = new Storage(bus)
bus.on('storage-did-load', function(document_) {
	system.install_document(document_)
})
bus.on('system-ready', function() {
	storage.load('./examples/guide/content.html')
})
system.initialize()
formats.initialize(system)
blocks.initialize(system)
atoms.initialize(system)
sample_atoms.initialize(system)
animated_atoms.initialize(system)
mention_atoms.initialize(system)
code_atoms.initialize(system)
hyperlink_atoms.initialize(system)
cards.initialize(system)
sample_cards.initialize(system)
animated_cards.initialize(system)
image_cards.initialize(system)
editable_cards.initialize(system)
design_block_cards.initialize(system)
code_cards.initialize(system)
