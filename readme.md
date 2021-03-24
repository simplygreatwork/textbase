
## TextBase

## Goals

- Create a robust rich text editor for the web which is a joy to develop and extend. 
- Be able to quickly configure or extend the editor in a straightforward manner with minimal learning and reading docs.
- Embrace progressive enhancement and feature detection.
- Use the concept of code over configuration for initializing the editor.
- Aim to follow the concept that flat is better than nested.
- Make it incredibly easy to add new features like inline elements and new block elements.
- Uses an event-based infrastructure based around a shared message bus.
	- To add new kinds of content, use the message bus to hook into the system instead of subclassing or creating plugins.
	- Cards and atoms can subscribe to events such as "card-will-enter:calendar" or "atom-will-exit:date"
	- This allows for much less overhead and scaffolding to extend the editor with new kinds of content.

## What this project is not at this time

- This project does not use document.executeCommand. All editing is achieved by manipulating the DOM directly.
- This project has only been tested with Google Chrome. Will branch out soon.
- This project does not yet use a JSON data model.
	- It's quite simple and uses HTML DOM nodes as the model.
- This project does not yet support collaboration.
	- In the future, this project might potentially use differential synchronization.

## Demo

A [simple environment](https://simplygreatwork.github.io/textbase/) is available on Github Pages.

## Known Issues

- Leading nodes in a block are being lost after redo of formatted content which had been split.
