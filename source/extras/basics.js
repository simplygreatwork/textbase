
export function iterate_characters(element, fn) {
	
	let node = editor.element
	let iterator = node_iterator(editor.element, node)
	while (node) {
		if (node instanceof Text) {
			for (let index in node.nodeValue) {
				let char = node.nodeValue[index]
				if (char != '\t') {
					fn(char, position, node, index)
					position = position + 1
				}
			}
		} else if (node instanceof HTMLBRElement) {
			fn('\n', position, node, 0)
			position = position + 1
		}
		node = iterator.nextNode()
	}
}
