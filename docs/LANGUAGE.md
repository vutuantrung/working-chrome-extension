# Language / Internationalization (i18n)

## 1. Overview

The sidepanel supports **English (`en`)** and **Vietnamese (`vi`)**. Users can switch languages in **Settings → Language** or using **StyleGallery → Language**. Translated React components update without a page reload.

The application also supports **Light / Dark** color modes. Gallery includes dedicated Mode controls so UI components can be previewed in both themes.

## 2. Main files

| File | Responsibility |
| --- | --- |
| `entrypoints/sidepanel/helpers/i18n.ts` | Language type, dictionaries, language persistence and reactive hook |
| `entrypoints/sidepanel/pages/settings/SettingsPage.tsx` | Settings controls, preference initialization and theme application |
| `entrypoints/sidepanel/gallery/StyleGallery.tsx` | Language and Mode controls for development previews |
| `entrypoints/sidepanel/assets/css/gallery.css` | Gallery controls and dark-shell styles |
| `entrypoints/sidepanel/assets/css/theme/color-mode.css` | Shared application dark-theme styles |
| `entrypoints/sidepanel/main.tsx` | Calls `initializeUiPreferences()` on startup |

## 3. Translation architecture

`i18n.ts` exports:

- `AppLanguage = "en" | "vi"`: supported languages.
- `getLanguage()`: reads the language from browser local storage, falling back to English.
- `setLanguage(language)`: persists the selection, sets `document.documentElement.lang` and dispatches `hydra:language-changed`.
- `translate(language, key)`: retrieves a translated string from the typed dictionary.
- `useTranslation()`: React hook returning `{ language, t }`; subscribes using `useSyncExternalStore` to language changes and browser storage events.

### Example

```tsx
import { useTranslation } from "../../helpers/i18n";

export function Example() {
  const { language, t } = useTranslation();

  return (
    <section lang={language}>
      <h1>{t("settings")}</h1>
      <p>{t("settingsHint")}</p>
    </section>
  );
}
```

### Adding a translation

1. Open `entrypoints/sidepanel/helpers/i18n.ts`.
2. Add **the same key** to both `dictionary.en` and `dictionary.vi`.
3. Use `t("newKey")` inside a component that calls `useTranslation()`.
4. Check both languages in Settings or Gallery.
5. Translate visible text, placeholders, tooltips, `aria-label`, empty states and error messages as applicable. Avoid translating API identifiers, storage keys, routes, log fields or enum values.

Keep dynamic values separate from message keys; current strings may use `replace("{platform}", platformName)` where necessary.

## 4. Persistence and startup

UI preferences are stored together under:

```text
localStorage["hydra:ui-preferences"]
```

Example:

```json
{
  "density": "comfortable",
  "reducedMotion": false,
  "theme": "dark",
  "language": "vi"
}
```

`initializeUiPreferences()` reads preferences on app startup, and `applyUiPreferences()` applies:

- `document.documentElement.dataset.colorMode` (`light` or `dark`)
- `document.documentElement.style.colorScheme`
- `document.documentElement.lang`
- density and reduced-motion attributes.

The Gallery Mode controls update both `data-color-mode` and `colorScheme`, and persist the new theme while preserving other preference fields. Language controls call `setLanguage()`, preserving the same preferences object.

## 5. StyleGallery testing

Open the extension sidepanel with the `?gallery=1` query string, then use the control group in the left sidebar:

- **Mode:** Light / Dark
- **Language:** English / Tiếng Việt

The language changes affect **components integrated with `useTranslation()`**. Static Gallery mock content and components not yet migrated may remain in their original language. Dark mode works on theme-aware styles; locally hard-coded CSS colors may require separate dark styles.

The controls are **persistent user preferences**, not isolated temporary toggles. Switching from Gallery also changes what the normal application will use the next time it opens.

## 6. Validation checklist

- [ ] Start in English and check Settings, GroupPage, Login and primary navigation.
- [ ] Switch to Vietnamese and confirm translated content updates without reload.
- [ ] Reload the page and confirm the language selection is retained.
- [ ] Test Light and Dark in Gallery and reopen the main application.
- [ ] Verify contrast and readable text on both themes.
- [ ] Confirm `document.documentElement.lang` matches the selected language.
- [ ] Ensure API payloads and persisted domain values remain unchanged when switching languages.
- [ ] Review untranslated UI strings when new components are added.

## 7. Current limitations

Translations are implemented incrementally. Some deep components, Gallery examples, raw server error messages and third-party content may not be fully localized. Do not translate raw backend response text by modifying its business meaning; map recognized error codes to localized UI messages instead. The relative-time and date formats should respect the active language.

The current implementation uses in-repository dictionaries and React hooks rather than an external i18n framework. More complex features (plural rules, interpolation, namespace separation and translation management) can be introduced later if needed.
