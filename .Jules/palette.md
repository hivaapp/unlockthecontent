## 2026-03-16 - Added ARIA labels for icon-only buttons
**Learning:** Found missing ARIA labels on utility icon buttons (plus, clear, close) across the app's dashboard link tabs. These are crucial for screen-readers when using standard lucide-react icons inside empty buttons.
**Action:** Always verify empty utility buttons have `aria-label` descriptions.
