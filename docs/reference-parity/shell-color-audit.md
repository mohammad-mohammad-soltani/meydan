# Reference shell and color audit — 2026-10-04

Authoritative design: `naghsh-man-full - 2026-10-03T205508.732(2).html` from Downloads. Parsed as HTML (not regex across React diagnostic strings), extracted styles and scripts, formatted for inspection. No reference bundle will ship in the application. The user request requires existing IRANSansXV, services, permissions, deep links and infrastructure to remain.

## Sources inspected before implementation

`AGENTS.md`, installed Next 16.3.4 CSS, local fonts, server/client components, Link guides; routes under `app/`; all `components/layouts/`, shared identity/badges/logo; `lib/meydan-api.ts`, shared me/theme code. Independent reports cover every requested feature boundary and backend Rest/Domain/SPEC/Postman contract.

## Inventory

`color-inventory.json` records 367 CSS custom-property declarations, 315 unique CSS color expressions, 50 gradient declarations, 106 shadow declarations, 322 border/outline declarations with colors, 244 alpha/color-mix declarations, and 98 unique color literals from JavaScript. These include inactive Tailwind utilities: the rendered final cascade determines which declarations are applied. Fonts and embedded font data are excluded. Source line numbers refer to formatted extracted CSS.

## Final palette and existing mapping

| Reference | Light | Night | AMOLED | Existing semantic mapping |
|---|---|---|---|---|
| `--m-bg` | `#fff` | `#1c1c1c` | `#000` | background/surface |
| `--m-soft` | `#f4f4f6` | `#242424` | `#0b0b0b` | surface-muted |
| `--m-line` | `#e8e8ec` | `#2b2b2b` | `#1b1b1b` | border/divider |
| `--m-tx` | `#101010` | `#f5f5f7` | `#f5f5f7` | foreground/emphasis |
| `--m-mu` | `#80838f` | `#8a8d98` | `#8a8d98` | muted-foreground |
| `--m-glass` | `rgba(255,255,255,.72)` | `rgba(11,11,14,.6)` | contextual | reference-glass |
| compose/FAB red | `#e4152e` | same | same | brand |
| FAB hover | `#b50d22` | same | same | brand-hover |
| nav active background | `color-mix(in srgb,#e4152e 7%,transparent)` | same | same | reference-nav-selected |
| liked | `#f0243a` | same | same | reference-like |
| reposted | `#3b82f6` | same | same | reference-repost |

The night values above are the final root-app override (formatted CSS 12046), NOT initial `.dark` values `#0b0b0b/#181818/#272727`. CSS 12658 finally overrides nav state to normal text and red icon; older rose text/background declarations are superseded. Notifications and booking overlays have contextual night text `#f4f4f5/#9a9aa3` and must not be incorrectly mapped to a global token.

## Geometry and rendered evidence

Playwright with system Chrome rendered the original reference; initial screenshots `/tmp/meydan-reference-{desktop,mobile}.png`, structured computed evidence `/tmp/meydan-shell-metrics.json`.

At 1440×900: document gutter 15px, container x=80 width=1265, navigation x=1045 width=280, centre x=410 width=635, trends x=100 width=310. Reference reserves additional nav end margin 20px `(1265-1225)/2`; child columns total 1225px. At widths 1024–1279 navigation 290px, trends 240px, centre flexes. Final CSS11089 removes the576px max-width below1024; the centre fills the document width. Wide routes hide trends and expand centre; chat additionally has 80px nav rail. Preserve production internal scroll region while reproducing sticky and scroll-dependent states.

Navigation row 48px, 16px inline padding, 14px gap, 18px corners; label span16.5px/500, icon22px final stroke1.5. Active text remains foreground, only icon red; selected background red7%. Sidebar header starts6px below16px parent top; space to nav24px. Primary compose54px/16.5px/600 at margin-top18px. Sidebar control footer borders align, with reference right sidebar zoom1.1.

Mobile header57px incl transparent1px border; reference ring mark24px, search32px. Bottom bar64px with 24px icons and10.5px labels; day/night/AMOLED backgrounds, borders, blur and shadows differ. Mini FAB40px with border; compose56px with source shadow, left16px and bottom80px. Reference auto-hides header/tab bar/bottom bar/FAB on downward scrolling and restores on upward scrolling.

## Existing differences to fix

AppShell columns currently256/576/288 instead of280/635/310, main root lacks max1265 and reference gutter, nav starts too low (`space-y-10` instead of24px). Active nav is red text; reference normal text/red icon. Theme active night text currently uses near-black inverse instead of app background. AMOLED brand currently incorrectly #ef4444. Theme muted night currently #9a9aa3 instead of base #8a8d98. Bottom nav lacks reference border, icon sizes and64px geometry. Logo is an unrelated brand mark; use reference vector mark variants without replacing font or sourcing mock assets. Drawer width310 and radius32 already match; opacity/background still need computed comparison.

No Unsplash/demo users/posts/statistics will be copied. Missing live content renders honest loading, empty or error states. Any claims of complete pixel parity require the screenshot/computed verification report; audit alone is not proof of completion.
