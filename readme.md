
## TextBase

## Goals

- Create a robust rich text editor for the web which is a joy to develop and extend. 
- Embrace progressive enhancement and feature detection. 
- Make it incredibly easy to add new features like inline elements and new block elements.
- Uses and event-based infrastructure based around a shared message bus.
	- To add new kinds of content, use the message bus to hook into the system instead of subclassing or creating plugins.
	- Cards and atoms can subscribe to events such as "card-will-enter:calendar" or "atom-will-exit:date"
- Allows for much less overhead and scaffolding to extend the editor with new kinds of content.
- Use the concept of code over configuration for initializing the editor.

## What this project is not at this time

- This package does not use document.executeCommand. All editing is acheived by manipulating the DOM directly. This is a good thing.
- This package does not yet support collaboration.
	- In the future, this project might potentially use differential sychronization.	
- This package does not yet use a JSON data model.
	- It's quite simple and uses HTML DOM nodes as the model.
