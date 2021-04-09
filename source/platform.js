
import { Logger } from './logger.js'

const logger = Logger()

export function initialize_platform(bus) {
	
	if (is_mac_os()) {
		bus.remap('keydown:control-a', 'keydown:meta-a')
		bus.remap('keydown:control-z', 'keydown:meta-z')
		bus.remap('keydown:control-shift-z', 'keydown:meta-shift-z')
		bus.remap('keydown:control-b', 'keydown:meta-b')
		bus.remap('keydown:control-i', 'keydown:meta-i')
		bus.remap('keydown:control-u', 'keydown:meta-u')
		bus.remap('keydown:control-]', 'keydown:meta-]')
		bus.remap('keydown:control-[', 'keydown:meta-[')
	}
}

function is_mac_os() {
	return navigator.platform.indexOf('Mac') > -1
}
