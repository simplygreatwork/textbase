
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
	storage.load('./examples/full/content.html')
})
system.initialize()
let [editor, history] = [system.editor, system.history]
formats.initialize(bus, editor, history)
blocks.initialize(bus, editor, history)
atoms.initialize(bus, editor, history)
sample_atoms.initialize(bus, editor, history)
animated_atoms.initialize(bus, editor, history)
mention_atoms.initialize(bus, editor, history)
code_atoms.initialize(bus, editor, history)
hyperlink_atoms.initialize(bus, editor, history)
cards.initialize(bus, editor, history)
sample_cards.initialize(bus, editor, history)
animated_cards.initialize(bus, editor, history)
image_cards.initialize(bus, editor, history)
editable_cards.initialize(bus, editor, history)
design_block_cards.initialize(bus, editor, history)
code_cards.initialize(bus, editor, history)
