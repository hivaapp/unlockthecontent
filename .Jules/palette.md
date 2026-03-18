## 2024-03-05 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found several icon-only buttons in `src/components/dashboard/tabs/LinksTab.tsx` (Plus, Close, Clear Search) lacking `aria-label`s, which makes them inaccessible to screen readers.
**Action:** Added `aria-label`s to these buttons. Always check icon-only interactive elements for `aria-label` or `aria-labelledby`.
