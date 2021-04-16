
import { insert_card } from '../features/cards.js'
import { Logger } from '../logger.js'

const logger = Logger()

export function initialize_design_block_cards(bus, editor) {
	
	let style = document.createElement('style')
	style.type = 'text/css'
	style.innerHTML = `
		.hero {
			border-radius:10px;
			background:royalblue;
			text-align:center;
			padding-top:50px;
			padding-bottom:50px;
		}
		.hero-text {
			padding-top:50px;
			padding-bottom:50px;
			color:white;
			font-weight:900;
			font-size:500%;
		}
	`
	document.querySelector('head').appendChild(style)
	
	bus.on('action:card-designed', function() {
		insert_card(editor, 'designed', `
			<div class="hero">
				<span class="hero-text" contenteditable="true">
					<span>Hero</span>
				</span>
			</div>
		`)
	}.bind(this))
	
	bus.on('card-will-enter:designed', function(card) {
		logger('system').log('card-will-enter:designed')
	}.bind(this))
	
	bus.on('card-did-enter:designed', function(card) {
		logger('system').log('card-did-enter:designed')
	}.bind(this))
	
	bus.on('card-will-exit:designed', function(card) {
		logger('system').log('card-will-exit:designed')
	}.bind(this))
	
	bus.on('card-did-exit:designed', function(card) {
		logger('system').log('card-did-exit:designed')
	}.bind(this))
	
	bus.emit('feature-did-enable', 'card-designed', 'Card: Design Block')
}
