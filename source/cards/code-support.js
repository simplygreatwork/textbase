
export function inject_css() {
	
	let style = document.createElement('style')
	style.type = 'text/css'
	style.innerHTML = `
		.code-card {
			position: relative;
			font-size:110%;
			font-weight:700;
			color:white;
			background:black;
			border-radius:8px;
			tab-size:2;
		}
		.code-source {
			position: absolute;
			z-index: 0;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border:1px solid black;
			border-radius:8px;
			background:rgba(0,0,0,0);
			color:rgba(0,0,0,0);
			caret-color: white;
		}
		.code-highlighted {
			z-index: 1;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			border:1px solid black;
			border-radius:8px;
			pointer-events:none;
		}
	`
	document.querySelector('head').appendChild(style)
}

export function get_placeholder_code() {
return `bus.on('content-did-split', function(a, b) {
	if (block_has_content(a)) return
	if (block_has_content(b)) return
	transform_block(editor, b, 'p')
}.bind(this))`
}
