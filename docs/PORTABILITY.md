# Sidepanel portability

This folder is intended to be movable into another React/Vite project.

## Boundary

- UI/components/pages do not call `chrome.runtime` directly.
- Chrome APIs live under `infrastructure/chrome`.
- Browser/standalone fallbacks live under `infrastructure/web`.
- `bootstrap/sidepanelServices.ts` selects Chrome adapters only when a Chrome extension runtime is available.
- Root-level project `api/` and `utils/` dependencies used by the sidepanel have been copied into this folder and imports point locally.
- WXT `#imports` is no longer required by this folder.

## Intentional Chrome-only code

`infrastructure/chrome/screenshotSelector.ts` is injected into a browser tab by `chrome.scripting.executeScript`. Its `chrome.runtime.sendMessage` calls are intentionally inside the Chrome infrastructure execution payload because they run in the injected extension context, not in React UI code.

## Standalone host integration

Outside Chrome, `BrowserRuntimeAdapter` emits `sidepanel:runtime-message` DOM events. A host application can listen for them and bridge commands to a backend if required.

```ts
window.addEventListener("sidepanel:runtime-message", (event) => {
  const message = (event as CustomEvent).detail;
  // route message to your standalone backend if needed
});
```
