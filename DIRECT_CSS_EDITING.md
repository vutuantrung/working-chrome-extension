# Direct CSS editing

The sidepanel no longer uses `reference-dashboard.css` or `reference-components.css` as late selector-level override layers.

## Rule

Edit the class in the CSS file that owns the component or feature. The value you see there is the value used by the UI, subject only to normal CSS pseudo-state/responsive rules.

Examples:

- `TopTabs` → `entrypoints/sidepanel/assets/css/layout/bottom-top-nav.css`
- `Sidebar` → `entrypoints/sidepanel/assets/css/components/Sidebar.css`
- `GroupPage` → `entrypoints/sidepanel/assets/css/features/groups.css`
- `TaskMonitorTab` → `entrypoints/sidepanel/assets/css/components/TaskMonitorTab.css`
- `CaseDetail` → `entrypoints/sidepanel/assets/css/components/CaseDetail.css`
- `CaseSidebar` → `entrypoints/sidepanel/assets/css/components/CaseSidebar.css`
- `ImageDetailModal` → `entrypoints/sidepanel/assets/css/components/ImageDetailModal.css`
- `Persona` reusable components → `entrypoints/sidepanel/assets/css/components/Persona.css`
- Persona pages → `entrypoints/sidepanel/assets/css/pages/PersonaPage.css`

Shared design tokens (primary red, semantic colors, typography scale) remain in `foundation/` by design. Component selectors themselves are no longer restyled later by a theme override file.
