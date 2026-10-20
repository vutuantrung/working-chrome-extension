# Reusable UI Components

Reusable primitives live under `entrypoints/sidepanel/components/ui/`.

## Extracted

- `Button` — shared button wrapper with disabled/loading/icon support while preserving feature-specific CSS classes.
- `IconButton` — accessible icon-only button with a required aria label.
- `SearchInput` — shared search markup and change handling; visual classes remain injectable by each feature.
- `FormField` — label + control composition for input/textarea/select fields.
- `MultiSelectFilter` — reusable multi-select dropdown extracted from `GroupPage`.

## Refactored usages

- `CaseSidebar`: `SearchInput`, `IconButton`
- `GroupPage`: `SearchInput`, `Button`, `MultiSelectFilter`
- `ConfirmModal`: `Button`, `IconButton`
- `ImageDetailModal`: `Button`, `IconButton`, `FormField`

## Intentionally domain-specific

Keep these as feature/domain components unless a second real use case appears:

- `PersonaCard`, `StatusBadge`, `StatusScreen`
- `CaseSidebarItem`, `CaseDetail`
- `TaskMonitorTab`
- `PlatformMetaBar`

This avoids creating generic components that merely hide domain-specific markup.
