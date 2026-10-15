# Hydra Sidepanel Portable App

This package contains only the sidepanel UI and the code it directly depends on.
It does not require WXT to run as a normal React/Vite application.

## Run standalone

```bash
npm install
npm run dev
```

## Architecture

- `entrypoints/sidepanel/application` — ports and application services
- `entrypoints/sidepanel/infrastructure/chrome` — Chrome extension adapters
- `entrypoints/sidepanel/infrastructure/web` — standalone browser fallbacks
- `entrypoints/sidepanel/bootstrap/sidepanelServices.ts` — runtime environment selection
- `entrypoints/sidepanel/api` and `utils` — sidepanel-local dependencies

When `chrome.runtime.id` exists, Chrome adapters are selected. Otherwise browser adapters are used.

## Runtime integration in standalone mode

Chrome runtime messages are not called from UI code. `BrowserRuntimeAdapter` emits:

```ts
window.addEventListener("sidepanel:runtime-message", (event) => {
  const message = (event as CustomEvent).detail;
  // Bridge this message to your host/backend if needed.
});
```

The injected screenshot selector under `infrastructure/chrome` intentionally contains direct
`chrome.runtime` calls because it executes as a Chrome injected extension payload.
