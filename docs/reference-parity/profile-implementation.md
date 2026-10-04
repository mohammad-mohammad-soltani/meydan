# Profile implementation

Owned profile UI/hook/meta scope; `profile-user-mapper.ts` and `profile-square-mapper.ts` remain owned by the API agent.

- Header follows final `.pf-*` cascade:196px cover with30px lower corners;108px centered avatar overlapping48px with22px side inset; stats19px/11.5px and8px bottom padding;21px identity;13.5px muted biography at1.9 line height/max420; chips6px gap with5px/11px padding;46px round actions.
- Cover controls now use14px insets,44px back control,36px grouped controls with4px glass padding and18px blur/saturation. Existing dynamic edit/notify/share/invite and permissions remain.
- Real cover/avatar images open a separate reference-style viewer:rgba(8,8,10,.78),18px backdrop blur,44px close,22px image corners or round avatar crop; keyboard Escape and body-scroll restoration. Cover respects its natural ratio/max94vw/82vh. No fake image opens for absent media. Viewer uses actual backend URLs and does not affect feed lightboxes.
- Followers sheet stays full-screen on mobile and occupies supplied `--col-l`/`--col-w` content column on desktop. Header38px back,50px tabs,44px round search, named48px avatars and34px follow controls match reference. Read-on-open API, search, badges and auth-gated follow behavior preserved.
- Missing narrative totals render “—” rather than current loaded-page length; explicit0 remains0. Profile tab counts also retain explicit0. Statistic chips omit narrative count by label rather than positional slicing.
- Deferred statistics update/append by label, preserving reflection totals when ordering changes or the narrative stat was absent. Independent square metadata/reflection requests settle separately; only explicitly supplied finite nonnegative counts render, preserving a real0 and omitting absent totals.

Verification:

- Full `tsc --noEmit`: passed.
- Scoped profile component/hook/helper/meta ESLint: passed with zero warnings.
- `node --experimental-strip-types --test tests/profile-stats.test.mjs tests/profile-summary.test.mjs tests/profile-infinite-scroll.test.mjs tests/public-profile-routes.test.mjs`:20tests passed. New runtime tests exercise missing vs0 totals, reordered/missing named-stat updates, input immutability, and partial metadata without synthetic zeros. Existing pagination, deferred-total and public-route checks pass.
- Scoped `git diff --check`: passed.
- Read-only real public route discovered from speaker link: `/abasalh_taghi_zadh`. Fresh development browser captured only the existing “در حال باز کردن صفحه” route-loading state at390/1440, consistent with absent hydration described in feature implementation report. No claim of live profile viewer/follower interaction verification. Root is coordinating production preview to exercise those handlers. No authenticated/backend mutations were made.
