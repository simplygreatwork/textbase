
export function Logger(scopes_) {
	
	if (scopes_) window.scopes = new Set(scopes_)
	return function(scope) {
		return {
			log: function(message) {
				if (window.scopes.has(scope)) {
					console.log(message)
				}
			}
		}
	}
}
