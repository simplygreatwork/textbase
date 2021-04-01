
## TextBase

## Goals

- Create a robust rich text editor for the web which is a joy to develop and extend. A work in progress.
- Be able to quickly configure or extend the editor in a straightforward manner with minimal learning and reading docs.
- Embrace progressive enhancement and feature detection.
- Use the concept of code over configuration for initializing the editor.
- Aim to follow the concept that flat is better than nested.
- Make it incredibly easy to add new features like inline elements and new block elements.
- Uses an event-based infrastructure based around a shared message bus.
	- To add new kinds of content, use the message bus to hook into the system instead of subclassing or creating plugins.
	- Cards and atoms can subscribe to events such as "card-will-enter:calendar" or "atom-will-exit:date"
	- This allows for much less overhead and scaffolding to extend the editor with new kinds of content.

## Demo

A [simple environment](https://simplygreatwork.github.io/textbase/) is available on Github Pages. This demo should always be serving a stable branch of the main branch. e.g. 2021-03-31

## What this project is not currently

- This project does not use document.executeCommand. All editing is achieved by manipulating the DOM directly.
- This project has only been tested with Google Chrome. Will branch out soon.
- This project does not yet use a JSON data model.
	- It's quite simple and uses HTML DOM nodes as the model.
- This project does not yet support collaboration.
	- In the future, this project might potentially use differential synchronization.

## Please help with

- Testing on other platforms, perhaps using Browser Stack. This project has currently only been tested in Google Chrome.
- Writing custom cards and atoms. Design blocks and content blocks would be nice to have. Atoms for storing metadata records would also be nice to have.

## Highlights

- Document integrity is ruled by a content scanner to ensure that the content is in the form we expect after each edit.
	- The message "content-did-change" is emitted with the changed begin and end nodes, and the scanner scans, validates, and corrects that section of the document, as needed.
- Content deletion is pluggable by listening to "delete-requested" on the bus. This way cards and atoms can handle their own deletion.
- Extending the editor with cards and atoms is done with listening to "card-will-enter", "card-will-exit", on the bus.
	- This approach is not opinionated and therefore you can manage initialization and lifecycle of cards and atoms inside these event handlers.
- History selection restoration is managed by listening to the history undo manager on the system bus.

## Roadmap

- Allow cards and atoms to have editable content managed by the history support. At the moment, the content of cards and atoms is not editable.
- Potentially stop using the browser's MutationObserver and create a custom mutation event system in preparation for collaboration features.

## Prior Art

I have investigated and dabbled with many rich text editing frameworks before deciding to create my own.

- Mobiledoc Kit
- SpyText
- editable.js
- Scribe
- Quill
- ProseMirror
- Substance
- and many others...