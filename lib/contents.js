
u.prototype.contents = function() {
	return this.map(function(node) {
		return this.slice(node.childNodes)
	})
}
