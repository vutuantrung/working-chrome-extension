# Sidepanel CSS organization

All sidepanel styles are centralized under:

```text
entrypoints/sidepanel/assets/css/
```

Structure:

```text
assets/css/
├── main.css                 # global stylesheet entrypoint
├── gallery.css              # gallery-only styles
├── foundation/              # tokens, typography, base, Ant Design overrides
├── layout/                  # shell/navigation/content layouts
├── features/                # feature-level shared styles
├── components/              # component-owned styles
└── pages/                   # page-owned styles
```

## Rules

1. Do not add `.css` files beside TSX files.
2. Do not create another `styles/` or nested `assets/css/styles/` tree.
3. Global styles are imported from `assets/css/main.css` in `main.tsx`.
4. Component/page-specific CSS should be imported by its owner from `assets/css/components` or `assets/css/pages`.
5. Typography tokens come from `assets/css/foundation/typography.css`.
