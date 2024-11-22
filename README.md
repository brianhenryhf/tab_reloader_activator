# tab_reloader_activator

This is a Chrome extension designed to do 2 things:
- Reload specific tabs at some interval (30 seconds or more)
- Disable Chrome recent-ish, memory-freeing "sleeping"/"discarding" behavior for specific tabs

## Why?
Regarding reloading: Reloading is a means of refreshing server-based web pages to check for changes, and also keeps a
timed session alive. Both can be useful. There are plenty of extensions out there that do this. Mostly, this is meant to
be minimal and trustworthy - source code is public and bare-bones. Also, just wanted to do it.

For "sleeping"/"discarding"-killing: Chrome has, in the last few years, implemented a mechanism to free up memory by
making less-recently-used tabs dormant, which chucks all the UI state out. This can be annoying for partially-filled web
forms, pages only accessible on VPN, etc. This lets you disable that function for a particular tab, so you can let the
state hang out until you come back to it.

## Installation
Installation currently is via `chrome://extensions` and enabling "Developer mode", then drag the extension folder to the
extension tab or click the "Load unpacked".

## Configuration
This does not yet have persistent configuration options. Planned options are fairly limited - default reload time, for
example.
