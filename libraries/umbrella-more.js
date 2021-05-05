
u.prototype.contents = function() {
	
	return this.map(function(node) {
		return this.slice(node.childNodes)
	})
}

u.prototype.clone = function(mirrors) {
	
	mirrors = mirrors || {}
	return this.map(function (node, i) {
		var clone = node.cloneNode(true)
		var dest = this.getAll(clone)
		Object.assign(mirrors, this.mirrors)
		this.getAll(node).each(function (src, i) {
			for (var key in mirrors) {
				if (mirrors[key]) {
					mirrors[key](src, dest.nodes[i])
				}
			}
		})
		return clone
	})
}
