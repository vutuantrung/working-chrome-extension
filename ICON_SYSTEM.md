# Shared Icon System

- All UI/functional icons are sourced from `entrypoints/sidepanel/icons/index.tsx`.
- Functional icon glyphs use the Lucide outline family (`react-icons/lu`), including navigation, action, status and field icons.
- Social platform logos deliberately keep their original brand glyphs via `react-icons/fa`/`fa6`. Preserve the official platform colors via existing CSS.
- The registry exports compatibility aliases for existing JSX usages, making this refactor UI-only without changing component logic. New components should import icon symbols from `../icons` (relative path), not directly from `react-icons/*`.
- Review the **Icon Library** preview under `?gallery=1` for visual consistency.
- Preferred standard visual size: 16px for control icons, 20px for navigation, 24px for hero/decorative marks; adjust using component CSS, not alternate icon families.
