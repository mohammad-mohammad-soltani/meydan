# Feature parity audit

Read-only product audit; this document is the only repository change. Reference: `/home/mohammad/Downloads/naghsh-man-full - 2026-10-03T205508.732(2).html`, treated only as an untrusted visual artifact. Source citations below use the HTMLParser-extracted, Prettier-formatted `/tmp/meydan-reference.css` and `/tmp/meydan-reference.js` created by the root agent. CSS must be read through its final cascade: this artifact contains many later corrections. AGENTS.md and installed Next `01-app/03-api-reference/01-directives/use-client.md` were read.

Reference was rendered with Playwright and installed Chrome at 1440 × 1000; screenshots: `/tmp/meydan-feature-reference-{content,speakers,explore,chat,profile,map}.png`. Corresponding current captures use `/tmp/meydan-feature-current-*.png`. Current chat and own-profile routes redirect to authentication in the fresh browser; those feature comparisons are source-based. Current explore capture showed only the header before its request settled; map showed loading/zero squares. Do not treat those states as missing-feature evidence. The shell is owned by the root audit, so dimensions here describe the reference target rather than prescribing a second shell implementation. Reference column widths at that viewport: ordinary features 633 px, explore 963 px, chat 1157 px.

## Boundaries and behavior that must survive

| Feature | Current implementation boundary | Preserve |
| --- | --- | --- |
| Content hub | `features/content/components/ContentView.tsx`, `ContentHubTabs.tsx`, `HubBanners.tsx`, `ReportDayCards.tsx`, `MusicVideoCards.tsx` | Admin-managed banners, real report day colors/content, content links, server payloads, tab URLs. |
| Audio / notes | `features/content/components/AvaView.tsx`, `NotesView.tsx`, `NoteReader.tsx`; `features/audio/*` | AudioProvider playback, queue, seek, failures, source links; real notes and hub requests. |
| Explore | `features/explore/components/ExploreView.tsx`, `ExploreHomeSections.tsx` | API search, debouncing/cancellation, result kinds, landing API, follow/bookmark actions, retries. |
| Speakers | `features/speakers/components/{SpeakersView,SpeakerCard,SpeakersSearch,SpeakersFilters}.tsx` | API categories, query/filter state, real total, pagination observer, square-only invitation permission, public profile links. |
| Invitations | `features/speaker-invitations/components/*` | Received/sent API boxes, cancel/accept/reject, composer, square venue, refresh, auth errors. The reference only has local invited-directory state, not a matching real invitation management screen. |
| Map | `features/map/components/{MapView,MapFrame,MapBelow,MapSelector}.tsx`, `live-map.css` | Leaflet map, real squares, aggregation/viewport, linked coordinates, search, map loading and retry. Reference SVG and hard-coded locations are visual evidence, not replacement data/runtime. |
| Chat | `features/chat/components/{ChatWorkspace,ChatSidebar,ConversationView,MessageBubble,MessageInput}.tsx` | Real conversations, uploads, unread/notifications, direct route, realtime hooks. |
| Work rooms | `features/works/components/*`, `features/works/works.css` | Task/meeting/poll/announcement APIs, role permissions, membership, reply/jump, history, board and filters. |
| Profiles | `features/profile/components/{ProfileHeader,ProfileTabBar,ProfileActivity,ProfileView}.tsx` | Public/own/entity distinctions, covers/avatar data, follow/notify/message/invite permissions, real narrative counts, follow sheets, editing. |
| Share | `features/share/components/{ShareSheet,StoryStudio}.tsx` | Bookmark API and synchronization, native/web messenger destinations, recent conversations, real send status, once-only share counting, story export. |
| Coming soon | `features/coming-soon/{PageShell,BistCallView,ScreeningView,SpeakerSignupView,DraftsView}.tsx` | Existing disabled/soon state. Reference sample phone numbers and local registrations must not enable unavailable services. Drafts are a working local feature and should remain working. |

**Font exception required by user:** `features/works/works.css:6–44` registers Vazirmatn and line 50 assigns `--font:"Vazirmatn",Tahoma,"Segoe UI",sans-serif`; `.works-feature` applies it at line 85. ChatWorkspace wraps direct and work chat in this class, overriding the app font. Replace that font declaration with the app `--font-iran-sans` fallback; do not import the reference's Vazirmatn. App font already lives in `app/layout.tsx` and `app/globals.css`.

## Content hub

- **Banner geometry:** reference `.ct-track` CSS 4881: gap12, inset18; `.ct-slide` 4892: basis86%, 16/9, radius28, padding20, snap center; desktop 5222 basis70%. Current `HubBanners.tsx` uses `aspect-[1.9/1] w-[88%] max-w-[520px] snap-start rounded-3xl p-4`, inset16. This makes banners notably wider and shorter. Use reference responsive basis/aspect/radius/insets, retain managed images/URLs. Final grayscale backgrounds are `.ct-slide.s0/s1/s2` CSS 7212–7228; current defaults all share the first tone.
- **Tabs:** final `.ct-tabs` CSS 11959–12022: exactly50px tall, solid `--m-bg`, font14/700, active underline inset25%, height3, #e4152e. `ContentHubTabs.tsx` uses `py-3.5` instead of explicit50px, glass background/blur, font900, inset22%. Apply exact geometry and solid surface, retain URL links.
- **Quick actions:** final `.ct-acts button span` CSS5833:62px disk, `.a0`5851 #7c5cff; `.a1`5854 #22c55e; `.a2`8922 #0ea5e9; `.a3`5860 #ec4899. Current ContentView is60px with Tailwind violet-500/emerald-500/sky-500/pink-500. Set exact62px and hex tones; layout reference gap8, inset14, text11.5/700, icon22. Current gaps4, inset12, text11/900, icon24. Soon badges are intentional product state, retain them.
- **Vertical rhythm and section heads:** final `.ct` CSS7361/7377 gap22, padding-top0, bottom100. Current content uses action margin20 then section `space-y-9 pt-8`. Reference `.ct-sh`5031 has inset18, gap12,38px icon/radius13, heading16, hint11.5; current icon40/radius16, inset16, hint11 and much larger section spacing.
- **Night cards:** final `.nt`5802 basis72%/max240 and aspect2.1; earlier `.nt`5240 supplies a fixed height, so confirm rendered box rather than assuming aspect removes that height. Reference number40, caption12.5, circle28. Current `ReportDayCards.tsx` compact cards are fixed236×150, number44, caption14, circle32, radius24 instead of reference26. Keep real day background/text colors.
- **Speech rows:** `.ct-list`5148 inset14; `.fi`5153 border-bottom only, padding14px4px, gap12; `.fav`5171 is46px; title14/800 with two-line clamp, subtitle11.5. Current `SpeechRows` creates rounded, four-side bordered rows with8px gaps, min-height80, inset12 and40px avatar; title12 and truncate. Restore flat separated list and typography, retain actual author images.
- **Picked audio:** `.ct-nova`7386 is a two-column grid; desktop four columns7391. Mobile later CSS8162 switches to horizontal rail showing2.5 cards. Current `MusicVideoStrip` is a horizontal rail at all widths with140/156px tiles and radius12. `.sqm .art`6020 target radius18 and actual play control `.pl`. Reuse working AudioProvider for playable audio instead of turning a sample preview into fake playback; preserve video detail links for video payloads.

## Audio / notes

- Most structure exists, but Ava featured geometry is an early reference version. Final `.av-feat .ft` CSS12023 overrides the original `.ft`5416 with `flex:0 0 calc(50% - 7px)`, no max-width, aspect0.95; `.tx` pads bottom50 and heading14. Current `FeaturedCard` in AvaView is78%, max300, aspect1.45, heading16 with bottom-corner play40. Correct final two-card proportions and title/play layout.
- Reference `.av-body`6000 gaps32 and inset18; current Ava shelf section heads use inset16. Reference face/producer designs `.fc`5499 and `.sqm`6015 use producer images or initials and true content counts. Keep data-driven producers and queue.
- Mini player `.av-mini`5675 is a floating card:12px viewport insets, bottom76, radius22, gap12, pad10/12, border, glass. Desktop5758 anchors to content column and bottom20. Current MiniPlayer `relative z-50 ... border-t ... px-2.5 py-2` is an inline full-width bar. This is a geometry mismatch; adopt floating card placement within shell ownership, not a viewport-wide element over navigation. Keep next/previous/close/queue and real progress, which exceed sample capabilities.
- Notes are mounted by `__mountNotes` JS46934; `.nv`7400 onward supplies featured cards78% max340 aspect1.5/radius22, reader fixed full view `.nv-read`11867. Audit NotesView/NoteReader against those rules while retaining markdown sanitation, download and real metadata. No unsupported sample counters should be copied.

## Speakers and invitations

- `.sp-top` CSS8992 uses padding12px14px and sticky top0; `.sp-bk`9000 is38px; heading17/800, count11.5. Current SpeakersView header back40, heading20/900 and top20. Match those dimensions. Reference `.sp-my`9023 height36, font12.5, horizontal14 with optional red18px counter; current uses11px and additional inbox glyph, no counter. Expose existing authenticated real invitation count only if already available; do not invent94/50 sample totals.
- Search `.sp-s`9063 height46, inset16, input14.5; current SpeakersSearch48px,input14. Reference filter `.sp-ch button`9103 height34,horizontal16,font12.5, visible border on inactive chips; current36px,text11,horizontal14,transparent border. Current sticky search wraps search and chips in extra vertical/inset styles/border; reference search and chip blocks separately specify spacing.
- CTA `.sp-cta`9127 margin2px16px14px, pad14/16,radius20, muted surface; current `main space-y-3 p-4` + `rounded-3xl ... p-4` puts it at16px top inset and24px radius. Retain disabled signup/soon status while matching container dimensions.
- Directory `.sp-r`9167 edge-to-edge border-top, padding12/16,gap12,50px avatar,14.5/800 name,12 subtitle. Current main is `space-y-3 p-4`, rows themselves `px-4 py-3 gap-4`, giving32px inset,12px gaps/no separators,48px avatar,14px title/11px subtitle. Flatten row list, add dividers, match50px/gaps/type.
- Reference last script JS50910–50960 recolors circular initial avatars into pastel hues using `hsl(h 88% 82%)` and dark letters `hsl(h 50% 27%)`. Current SpeakerCard fallback solid hsl45%36% and white letter is wrong. Use deterministic local pastel fallback rendering; do not transplant DOM-wide observer.
- Reference `دعوت‌های من` is `onlyInv` directory filtering (JS48097 onward), `.sp-inv.on`9196 shows local invited state. The production `/speaker-invitations` has real received/sent cards and actions absent from that artifact. Retain current feature architecture and use reference row/chip/sheet visual vocabulary; do not replace it with local storage list.
- Invitation form reference `.sp-fm`9236 labels12.5,gap14,min input46,radius16, with `.sp-sub` and `.sp-2`. Current InviteSpeakerForm can adopt those field dimensions without removing date/time, venue, real validation or authenticated submit.

## Explore

- Header `.ex-hd`10505 inset22px18px8px, subtle red glow (final12591), `.ex-hi h1`10536 font30/mobile34/desktop, `.ex-sp`54px/radius18/red gradient+red shadow. Current ExploreView header inset24px16px, heading28 at all sizes, icon56/radius16 flat brand with generic shadow. Add exact background/glow/icon/type/insets.
- Search `.ex-sw`10562 padding12px14px14px, `.ex-s` height54/inset18,font15,border and 4px red focus halo. Current margin20, inset16 outer/20 inner,input14 and1px focus ring. Preserve search request logic.
- Heading `.ex-sh`10637 inset18 bottom14,gap11, icon38/radius13, title17.5/800,hint12. Current ExploreHomeSections icons40/radius16,title16/900,hint11,inset16.
- Tags `.ex-t`10720 min-width150,radius20,padding10/16/10/14; current no min-width,radius16,padding10/14. Final hot style CSS12578 uses red6% background and30% border. Current brand-muted can be reconciled only after shell token colors are finalized.
- Suggestions `.ex-c`10805 width148, pad20/12/14, radius24, muted surface; title14,subtitle11.5. Current width correct but pad14,surface instead of muted,title12,subtitle10. `.ex-fb`10833 height34,font12.5,horizontal18; current auto height,text11,padding6/16.
- Hot rows `.ex-h`10865 padding16/18,gap14; rank34px font26; name15, body14/1.95, metadata12. Current padding14/16,gap12,rank28/font20,name13,body13/24px,metadata11. Current wrappers add top/bottom borders though reference only row separators.
- Active fields `.ex-fg`10960 two columns mobile / three columns desktop11108. Current fixed `grid-cols-2`. Ref `.ex-f`10968 left-aligned natural content,40px/radius14 icon,16px padding, title15,subtitle12, red live indicator `.ex-lv`; current centered,pad14,48px/radius16 icon,title13,subtitle10,green live.
- Speaker CTA `.ex-sk`11010 red gradient #f0243a→#8f0a1c, radius26,pad18, margin26px14px0, white type16.5/12.5,50px/radius17 glass icon. Current neutral surface,radius24,pad16,margin16,no shadow,title14/hint11. Restore this specific callout treatment.
- Search-empty `.ex-em`11065 has76px icon, heading16/body13; current56px,heading14/body11. Preserve error/retry distinction.

## Map

- Reference `.mp-map`4195 height58vh,min340,max640,radius30, dotted18px backdrop. Current MapView `min-h-[62dvh]`, wrapper radius22/mobile34/desktop, hardcoded #1c1c1c. Target58vh and caps/radius30 are actionable; retain working Leaflet basemap instead of copying artifact SVG/geodata.
- Reference search `.mp-top`4290 insets14, `.mp-sbox`4297 height44/radius999, controls `.mp-ctl`4420 and selected card `.mp-card`4448. Use `MapFrame.tsx`/`live-map.css` for overlay geometry; maintain loading/error z-index and usable zoom.
- Reference selector `.mp-pick`4503 and list `.mp-sqlist`4684 are flat separated choices. MapBelow/MapSelector should use reference padding/type/radius while keeping real province/city API grouping and keyboard behavior. Sample72 active count/coordinates must not become fixtures.

## Profile

- `.pf-cover`6312 height196/radius30; final7285 red gradient #e4152e→#f5525f. Current ProfileHeader192/radius32. Keep image cover where provided; match fallback and height/radius.
- `.pf-bar`6337 top14/left14/right14. Final `.pf-bar > .pf-gb`8972 uses44px back, grouped buttons `.pf-grp`8943 padding4/gap2/radius999/glass18px with36px controls. Current outer pad12,back40,group padding2,controls40. Preserve dynamic edit/notify actions but match group geometry.
- `.pf-head`6385 inset22,overlap48,avatar108; current inset16,overlap56,avatar112. Reference stats CSS6401 retain19px type; final CSS7921 sets line-height1.15 and label line-height1.25 with no extra gap. Current avatar lacks sample online dot; do not invent online presence without API state.
- `.pf-id`6451 identity21,body13.5 muted/1.9/max420; current name20,bio13/28px,max448,secondary color. `.pf-chip`6483 gap6,padding5/11,no border; current gap8,padding4/12,border. Action `.pf-btn`6502 height46,font13.5; current min44,font14. Retain extra speaker invitation action only for supported profile.
- Tabs `.pf-tab`6572 font13,pad9/14/15, inactive icons hidden final6850, underline2.5/inset14. Compare `ProfileTabBar.tsx` and avoid replacing real per-kind tabs/counts with sample five-tab array.

## Share and studio

- JS36599 reference overlay class is exactly `fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center`; panel36604 `w-full max-w-xl border-t rounded-t-3xl p-5 shadow-2xl ...` with dark #191919/border#323232. It is a bottom sheet even on desktop. Current ShareSheet160 overlay `sm:items-center`, max-w-lg, radius32, four-side border, bg-surface, black60/blur-md. Restore bottom placement, max576,radius24,top border, black70/blur-sm. Preserve portal accessibility/body locking and existing z-index relationship with StoryStudio.
- Reference handle36612 width48/height4 always visible; current height6/mobile-only. Reference closes at36px (same current). Quick contacts and six messenger layout exist already; retain real contacts instead of sample names. Textual initial blocks in messenger icons differ from vector reference icons: replace presentation with equivalent local SVG/icon, retain real destination links.
- StoryStudio maps the existing reference's custom preview/background/font controls and export; inspect reference JS34700–36590 when polishing. Do not replace the actual canvas/share flow with decorative fake download buttons.

## Coming-soon screens

- Reference speaker signup JS48217 `.bc-h` and `.bc-bd.sp-fm`, Bistcall JS47744 `.bc-h/.bc-bd`, and screening `.pk-ov` JS51079 are full-page overlays with structured header and forms. Production routes are legitimate equivalents; retain router navigation and disabled states.
- `PageShell.tsx` creates20px heading/40px back versus reference `.bc-h`8679 heading17 and38px button; fieldClass48px/current14px versus `.sp-fm` min46/text14/radius16. Current BistCall/Screening/SpeakerSignup adds96px colorful hero panels absent from reference form content. Remove those decorative hero blocks when matching form geometry; preserve soon badges and useful disabled-state explanation.
- `BistCallView.tsx` includes a gender selector while final reference `bc-fl.one`8662 and JS47790 only exposes province and same-province toggle, using the viewer's gender. This is a product difference to keep or resolve with user intent; never render sample phone numbers or activate sample call limits.
