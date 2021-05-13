
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

export class Application {
	
	constructor() {
		
		let bus = new Bus()
		let system = new System(bus)
		let storage = new Storage(bus)
		this.listen(bus, system, storage)
		bus.on('system-ready', function() {
			storage.load(this.options())
		})
		system.initialize()
		this.configure(bus, system.editor, system.history)
	}
	
	configure(system) {
		
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
	}
	
	listen(bus, system, storage) {
		
		bus.on('storage-did-load', function(document_) {
			system.install_document(document_)
		}.bind(this))
		
		bus.on('storage-did-save', function(status) {
			logger('trace').log('storage-did-save: ' + status)
		}.bind(this))
		
		bus.on('content-did-change', function(begin, end) {
			this.debounce(function() {
				let content = u(system.editor.content).clone().first()
				bus.emit('document-will-serialize', content)
				system.document_.content = content.innerHTML
				storage.save(system.document_)
			}.bind(this))
		}.bind(this))
	}
	
	options() {
		
		// e.g. http://127.0.0.1:8080/textbase/?path=https://jsonbin.org/user-id/path-to-resource&token=token-id
		
		let parameters = new URLSearchParams(document.location.search.substring(1))
		if (parameters.get('path')) {
			return {
				mutable: true,
				path: parameters.get('path'),
				token: 'token ' + parameters.get('token')
			}
		} else {
			return {
				mutable: false,
				path: './examples/savable/content.html'
			}
		}
	}
	
	debounce(fn) {
		
		if (this.id) window.clearTimeout(this.id)
		this.id = window.setTimeout(function() {
			this.id = null
			fn()
		}.bind(this), 3000)
	}
}

new Application()
