
import { System } from './system.js'

export class Application {
	
	constructor() {
		
		this.system = new System()
		this.system.load_document('./documents/all.html')
	}
}
