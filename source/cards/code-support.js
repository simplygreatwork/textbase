
import { inject_css as inject_css_ } from '../basics.js'

export function get_placeholder_code() {
return `bus.on('content-did-split', function(a, b) {
	if (block_has_content(a)) return
	if (block_has_content(b)) return
	transform_block(editor, b, 'p')
}.bind(this))`
}
