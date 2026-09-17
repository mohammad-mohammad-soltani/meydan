# پنل مدیریتی میدان در اپ Next.js (`app/(app)/admin/**`)

> این پلن در سشن `EitaaUserBot` تأیید شده است. کد میدان بیرون این ورک‌اسپیس است
> (`/home/mohammad/Desktop/meydan`) و نوشتن در آن از این سشن مجاز نیست
> (تست شد: `Permission denied`). اجرا باید در سشنی انجام شود که با
> `cd /home/mohammad/Desktop/meydan && npx @deepseek-ai/dsh web` باز شده است.
> اولین کار آن سشن: کپی این فایل به `docs/superpowers/plans/<date>-admin-panel.md`
> و طراحی تفصیلی به `docs/superpowers/specs/<date>-admin-panel-design.md`.

## هدف و معیار موفقیت

ساخت یک پنل مدیریتی کامل و دقیق در اپ Next.js پروژه میدان که تمام ۱۲ بخش مستندات API مدیریتی را پوشش دهد؛ سرخط آن **«افزودن میدان»** است.

معیار پذیرش نهایی:

1. کاربری با نقش وردپرسی `administrator` می‌تواند از داخل اپ: میدان بسازد/ویرایش/تأیید/رد/تعلیق/حذف کند، سخنران ارتقا/ویرایش/حذف کند، درخواست‌ها و دعوت‌ها را تصمیم‌گیری کند، محتوا/تولیدکننده/رسانه/بازتاب رسانه‌ای بسازد و ویرایش کند، روایت را سردبیری یا به محتوا تبدیل کند، ابتکار/کمپین بسازد و اعضای ابتکار را مدیریت کند و اعلان گروهی بفرستد.
2. کاربر غیر administrator (از جمله `meydan_manager`) به هیچ صفحه‌ی پنل دسترسی ندارد و لینک پنل را هم نمی‌بیند.
3. هیچ صفحه‌ای بدون حالت loading/empty/error/forbidden و بدون پیام خطای فارسی سرور (شامل خطاهای فیلدبه‌فیلد ۴۲۲) نماند.
4. `npx eslint`, `npm run build` و تست‌های `node --test` سبز باشند و جریان ساخت میدان به‌صورت دستی روی WP لوکال (`http://localhost:8082`) تأیید شود.

## پیش‌نیاز اجرا

- سشن باید در `/home/mohammad/Desktop/meydan` باز باشد (ورک‌اسپیس = همان ریپو).
- کد بک‌اند روی برنچ `codex/admin-api` (uncommitted) است و کانتینر WP روی پورت 8082 بالا است؛ برای تست دستی به یک حساب `administrator` و مقدار `MEYDAN_DEV_OTP_CODE` از `meydan-backend/.env` نیاز است. بررسی شد: `GET http://localhost:8082/wp-json/meydan/v1` → 200 و `GET /admin/squares` بدون احراز هویت → 401 با همان envelope مستندات.

## تصمیم‌های معماری

| موضوع | تصمیم | دلیل |
|---|---|---|
| محل پنل | `app/(app)/admin/**` | وارث `AppShell`، تم، `template.tsx`، `loading.tsx` و providerها می‌شود؛ هیچ قرارداد جدیدی معرفی نمی‌کند |
| گیت دسترسی | سرور-ساید در `app/(app)/admin/layout.tsx` با `accessTokenHeader()` + `GET /me`؛ غیر administrator → صفحه‌ی ۴۰۳؛ ۴۰۱ → `redirect(loginHref("/admin"))`؛ خطای شبکه → صفحه‌ی خطای retryable | تنها منبع حقیقت نقش، خود API است (`role`/`roles` اضافه‌شده در `/me`)؛ fail-closed |
| محافظت مسیر | افزودن `"/admin"` به `PROTECTED_ROUTE_PREFIXES` و `"/admin/:path*"` به matcher در `proxy.ts` | `proxy.ts` فقط حضور کوکی را چک می‌کند؛ نقش را گیت لایوت تعیین می‌کند |
| لایه API | استفاده از `meydanApi` موجود + افزودن یک variant پوششی به `lib/meydan-api.ts` برای خواندن `meta` (صفحه‌بندی page/per_page) | لیست‌های ادمین `next_cursor` ندارند و `meydanApi` متا را دور می‌ریزد |
| UI | بدون کتابخانه‌ی کامپوننت؛ همان توکن‌های semantic از `app/globals.css` و رشته‌کلاس‌های کپی‌شده | قرارداد فعلی پروژه (هیچ Button/Input/Modal مشترکی وجود ندارد) |
| نوتیفیکیشن سبز/خطا | الگوی `notice` محلی با `role="status"` و تایمر + `role="alert"` برای خطا | تنها الگوی موجود در پروژه؛ toast library نداریم |
| تأیید عملیات مخرب | `AdminDialog` پورتال‌شده (مثل `PostAdminActions`/`InviteSpeakerForm`): `role="dialog"`, Escape, کلیک backdrop | الگوی تأییدشده در ریپو |
| نقشه | Leaflet با `import("leaflet")` داخل `useEffect` + `addOpenFreeMapBasemap` و `LIVE_MAP_THEME`؛ برای انتخاب موقعیت، `LocationPickerMap` موجود | react-leaflet و پلاگین clustering در پروژه وجود ندارند و نباید اضافه شوند |
| آپلود رسانه | `uploadNarrativeFile(file, purpose)` از `lib/meydan-upload.ts` با `purpose: "avatar"|"cover"|"narrative"` | تنها مسیر آپلود موجود (چانک‌بندی + پروکسی `/api/meydan`) |
| تاریخ‌ها | `PersianDatePicker`/`PersianTimePicker`؛ مقدارها میلادی `YYYY-MM-DD`/`HH:mm` | قرارداد پروژه: UI جلالی، value میلادی |
| بازکردن دوباره‌ی فرم | `router.push` + `router.refresh()` بعد از ساخت/حذف؛ حالت optimistic برای تغییر وضعیت در لیست | مطابق `ComposeView`/`ProfileEditView` |

## فاز ۰ — زیرساخت

- `lib/protected-routes.ts` (ویرایش): افزودن `"/admin"` به `PROTECTED_ROUTE_PREFIXES`.
- `proxy.ts` (ویرایش): افزودن `"/admin/:path*"` به `config.matcher`.
- `lib/meydan-api.ts` (ویرایش، additiv):
  - استخراج هسته‌ی fetch/parse موجود و افزودن `meydanApiEnvelope<T>(path, init?): Promise<{ data: T; meta: Record<string, unknown> }>`؛ `meydanApi` و `meydanApiPage` روی همان هسته بازنویسی شوند (رفتار و پیام خطای فعلی حفظ شود).
  - گسترش `MeydanApiError` با `code?: string` و `fields?: Record<string, string>` (از `body.error.code/fields`) تا فرم‌ها خطای فیلدی ۴۲۲ را نشان دهند. تغییر backward-compatible است.
- `features/auth/services/viewer-role.service.ts` (جدید): `ADMIN_ROLE = "administrator"`، `extractRoles(me)`، `hasAdministratorRole(me)`، `fetchViewerRoles(headers?)`. `features/auth/hooks/useViewerRole.ts` روی همین سرویس بازنویسی شود.
- `app/(app)/admin/layout.tsx` (جدید): گیت سرور-ساید + `export const dynamic = "force-dynamic"` + `AdminSectionNav`.
- `features/admin/components/AdminNavLink.tsx` (جدید): لینک «پنل مدیریت» فقط برای administrator؛ مصرف در `components/layouts/AppShell.tsx` (ناوبری دسکتاپ؛ `BottomNavigation` با `grid-cols-5` دست‌نخورده).
- `features/admin/components/`: `AdminSectionNav`, `AdminPageHeader`, `AdminNotice`, `AdminEmptyState`, `AdminErrorState`, `AdminTable`, `AdminPagination`, `AdminFilters`, `AdminField`, `AdminDialog`, `AdminStatusBadge`, `MediaPickerField`, `GeoPickerField`, `ChannelFields`, `ScheduleRows`, `IdLookup`.
- `features/admin/services/admin-api.ts` (جدید): `adminGetList/adminGetItem/adminPost/adminPatch/adminDelete`؛ `adminPost` برای هر submit یک `idempotency-key: crypto.randomUUID()` تازه می‌سازد (بک‌اند POSTها را ۲۴ ساعت کش می‌کند و **حتی پاسخ 4xx را replay می‌کند**).
- `features/admin/lib/normalize.ts` (جدید، خالص/تست‌پذیر): نرمال‌سازی `labels`، `linked_content`، `schedule`، `audience`، اعتبارسنجی مختصات/بازه تاریخ.
- `features/admin/types.ts`: تایپ‌های دامنه‌ای camelCase (snake_case فقط داخل سرویس‌ها).

پذیرش فاز ۰: `/admin` فقط برای administrator؛ مهمان → `/auth?returnTo=/admin`؛ `npm run build` سبز؛ matcher تست به‌روز.

## فاز ۱ — میدان‌ها (سرخط)

| مسیر | کار | endpointها |
|---|---|---|
| `/admin` | نمای کلی | `GET /admin/squares?status=pending_verification&per_page=1` → `meta.total`، `GET /admin/speaker-requests?status=pending`، `GET /admin/speaker-invitations?status=pending` (با `Promise.allSettled`) |
| `/admin/squares` | لیست + فیلتر `q`, `status`, `verified`, `province_id`, `city_id`, `page`, `per_page` (≤۱۰۰) + صفحه‌بندی از `meta` | `GET /admin/squares`؛ `GET /geo/provinces`, `GET /geo/cities?province_id=` |
| `/admin/squares/new` | **افزودن میدان**: `phone*`, `full_name`, `email`, `square_name*`, `description`, `contact_name`, `contact_phone`, `start_date`, `avatar_media_id`, `province_id*`, `city_id*`, `address*`, `latitude`, `longitude` (نقشه + reverse geocode)، `eitaa_channel`, `bale_channel`, `status ∈ {pending_verification, approved}` | `POST /admin/squares` |
| `/admin/squares/[id]` | مشاهده + ویرایش (`name`/`square_name`؛ قاعده‌ی «همه‌ی ۵ فیلد جغرافیایی با هم») + فرم وضعیت با `admin_note` + حذف نرم | `GET|PATCH|DELETE /admin/squares/{id}`, `POST /admin/squares/{id}/status` |
| `/admin/squares/map` | نقشه‌ی میدان‌ها با رنگ بر اساس `approval_status`/`verified` و پاپ‌آپ لینک‌دار | `GET /admin/squares/map` |

رفتارهای اجباری:

- `POST /admin/squares` فیلد `name` را نمی‌پذیرد؛ فقط `square_name`.
- نگاشت ۴۲۲: `phone: invalid|taken`، `square_name: required`، `city_id: invalid`، `address: required`، `email: invalid_or_taken`، `latitude|longitude: invalid`، `status: invalid`.
- شهر باید عضو همان استان و `active` باشد.
- ساخت با `status=approved` هیچ اعلانی برای مالک نمی‌فرستد → راهنمای صریح در فرم.
- `start_date` نامعتبر در بک‌اند بی‌صدا نادیده گرفته می‌شود → اعتبارسنجی تاریخ در فرم.
- ویرایش موقعیت فقط با ارسال هم‌زمان `province_id, city_id, address, latitude, longitude`.
- میدان‌های بدون ردیف geo در `/admin/squares/map` نیستند؛ empty state توضیح دهد.

## فاز ۲ — سخنران‌ها، درخواست‌ها، دعوت‌ها

| مسیر | کار | endpointها |
|---|---|---|
| `/admin/speakers` | لیست با فیلتر `q`, `verified`, `speaker_category`, `city_id` + انتخاب کاربر برای ارتقا | `GET /admin/speakers`, `GET /admin/speakers/linkable-users`, `GET /speaker-categories` |
| `/admin/speakers/new` | ارتقا (`user_id*` + `name`, `bio`, `role`, `handle`, `expertise`, `initials`, `avatar_media_id`, `verified`, `cities[]`, `categories[]`, `social_links[]`) | `POST /admin/speakers` |
| `/admin/speakers/[id]` | ویرایش + «حذف نقش سخنران» با تأیید | `PATCH|DELETE /admin/speakers/{user_id}` |
| `/admin/speaker-requests` | لیست + فیلتر `status` + تغییر وضعیت | `GET /admin/speaker-requests`, `PATCH /admin/speaker-requests/{id}` |
| `/admin/speaker-requests/[id]` | مشاهده کامل + فرم وضعیت | `GET|PATCH /admin/speaker-requests/{id}` |
| `/admin/speaker-invitations` | لیست + فیلتر + تغییر وضعیت | `GET /admin/speaker-invitations`, `PATCH /admin/speaker-invitations/{id}` |

- `user_id` خطاهای `invalid`/`not_eligible` (حساب `administrator` یا `meydan_square` ارتقا نمی‌یابد). ارتقا idempotent.
- لیست‌ها بدون صفحه‌بندی (سخنران ۵۰، درخواست/دعوت `LIMIT 100`) → سقف برچسب بخورد، صفحه‌بندی جعلی ساخته نشود.
- `phone` هرگز برای ادمین برنمی‌گردد (`phone_visible: false`).

## فاز ۳ — محتوا، تولیدکننده، رسانه، کارگاه روایت

| مسیر | کار | endpointها |
|---|---|---|
| `/admin/content` | لیست منتشرشده + فیلتر `format`, `featured`, `category`, `tag` + حذف | `GET /content`, `DELETE /admin/content/{id}` |
| `/admin/content/new` | `title`, `body`, `excerpt`, `status`, `format`, `usage_note`, `subtitle`, `badge`, `location_label`, `media_duration`, `featured`, `attachments[]` (آپلود), `files[]`, `tags[]`, `category`, `creators[]` | `POST /admin/content` |
| `/admin/content/[id]` | ویرایش | `GET /content/{id}`, `PATCH /admin/content/{id}` |
| `/admin/creators` + `/new` + `/[id]` | CRUD تولیدکننده (`name*`, `bio`, `types[]`, `role`, `handle`, `expertise`, `initials`, `avatar_media_id`, `verified`, `cities[]`, `social_links[]`) | `GET /creators`, `POST|PATCH|DELETE /admin/creators...` |
| `/admin/media-outlets` + `/new` + `/[id]` | CRUD رسانه (`name*`, `avatar_media_id`, `website`, `bale`, `eitaa`) | `GET /media-outlets`, `POST|PATCH|DELETE /admin/media-outlets...` |
| `/admin/narratives` | جست‌وجوی روایت (`IdLookup` + `GET /explore/search?types=narrative`) و لیست سردبیری | `GET /narratives/{id}`, `GET /editorial/narratives`, `GET /explore/search` |
| `/admin/narratives/[id]` | کارگاه: نمایش/وضعیت، سردبیری، تبدیل به محتوا با فرمت، CRUD بازتاب رسانه‌ای | `PUT|DELETE /admin/narratives/{id}/editorial`, `POST|DELETE /admin/narratives/{id}/content`, `GET /narratives/{id}/media-reflections`, `POST /admin/narratives/{id}/media-reflections`, `PATCH|DELETE /admin/media-reflections/{id}` |

مغایرت‌های مستند با کد (کد مرجع است):

- **`media_outlet_id` وجود ندارد**: فیلدها `outlet_id` (عدد) یا `outlet` (نام) هستند؛ به‌علاوه `title*`, `url*`, `summary`, `logo_media_id`, `published_at`, `status`, `position`.
- حذف بازتاب **hard delete** و غیر idempotent است.
- `POST /admin/content` با `status != publish` پاسخ `data: null` (201) می‌دهد → به بدنه تکیه نکن؛ پیام «ذخیره شد (پیش‌نویس)» و بازگشت به لیست.
- `creators` محتوا آرایه‌ی id یا `{id|creator_id, position, role_label}`.
- تبدیل روایت idempotent است؛ حذف تبدیل بار دوم ۴۰۴.
- `/admin/narratives/{id}/editorial` فقط گیت administrator را دارد.

## فاز ۴ — ابتکارها، کمپین‌ها، اعلان

| مسیر | کار | endpointها |
|---|---|---|
| `/admin/initiatives` + `/new` + `/[id]` | `title*`, `description`, `cta_label`, `starts_at`, `ends_at`, `status`, `allow_guest_join`, `labels[]`, `linked_content[]`, `schedule[]`, `order`, `post_status` | `GET|POST /admin/initiatives`, `GET|PATCH|DELETE /admin/initiatives/{id}` |
| `/admin/initiatives/[id]/participants` | لیست اعضا (ستون‌های خام: `id, member_type, user_id, guest_id, joined_at, status`) + ویرایش `status`/`joined_at` | `GET /admin/initiatives/{id}/participants`, `PATCH .../participants/{member_id}` |
| `/admin/campaigns` + `/new` + `/[id]` | همان الگو + `current`؛ `participant_count` کمپین نمایش داده نشود | `GET|POST /admin/campaigns`, `GET|PATCH|DELETE /admin/campaigns/{id}` |
| `/admin/notifications` | `title*`, `body*`, `audience` (`all|users|squares|province|city|specific_ids` + `id`/`ids`)، `deep_link`؛ نمایش `created` | `POST /admin/notifications/broadcast` |

- `post_status` فقط `publish|draft|pending|future` وگرنه به `publish` تحمیل می‌شود.
- `allow_guest_join` فقط برای ابتکار.
- `status` ابتکار از `draft|active|ended|disabled`.

## موارد لبه و حالت‌های شکست

- ۴۰۱ → ریدایرکت به لاگین با `returnTo` (پروکسی خودش refresh + یک retry دارد).
- ۴۰۳ → صفحه‌ی «دسترسی ندارید» با بازگشت به `/home`؛ مسیرهای `/admin` به `requiresClientAuthentication` اضافه **نمی‌شوند** (جلوگیری از loop).
- ۴۲۲ → نگاشت `error.fields`؛ خطاهای بدون `fields` (وضعیت برنامه‌ها، فرمت محتوا، اعلان) به‌صورت بنر.
- ۴۰۴ → `notFound()` در صفحات جزئیات؛ در دیالوگ‌ها پیام + بستن و رفرش لیست.
- نبود لیست ادمین برای محتوا/تولیدکننده/رسانه → لیست‌های عمومی (فقط `publish`) + اعلام محدودیت در هدر.
- `/admin/squares/map` بدون صفحه‌بندی/فیلتر → تجمیع ساده‌ی سمت کلاینت برای تعداد بالا، بدون پلاگین.
- `avatar_media_id` رسانه در پاسخ نیست → نمایش `avatar_url`.
- `deep_link` اعلان باید مسیر داخلی اپ باشد؛ اعتبارسنجی سبک.

## تست و اعتبارسنجی

- `tests/protected-routes.test.mjs` (ویرایش): assert مسیرها و matcher جدید.
- `tests/admin-api-paths.test.mjs` (جدید، assert رشته‌ای): مسیر/متد درست؛ به‌طور خاص `outlet_id` (نه `media_outlet_id`)، `/admin/squares/{id}/status`، `/admin/narratives/{id}/editorial|content`.
- `tests/admin-normalize.test.mjs` (جدید، import خالص با `--experimental-strip-types`): `labels`/`linked_content`/`schedule`/`audience`، `hasAdministratorRole`، مختصات.
- `tests/admin-gate.test.mjs` (جدید، assert رشته‌ای): گیت fail-closed و عدم رندر لینک برای غیر administrator.
- `.github/workflows/chat-ui-ci.yml` (ویرایش): افزودن `features/admin/**` به `paths` + step هر تست.
- دستی روی WP لوکال: ساخت میدان واقعی (استان/شهر معتبر، نقشه، آواتار، کانال)، دیدن در فیلتر `pending_verification`، تأیید و بررسی اعلان مالک؛ ارتقا/demote سخنران؛ تبدیل روایت به محتوا؛ ثبت بازتاب؛ ارسال اعلان با `audience.type=specific_ids`.

## خارج از دامنه / پیگیری

- افزودن `GET /admin/content`, `/admin/creators`, `/admin/media-outlets`, `/admin/narratives` به meydan-core برای دیدن پیش‌نویس‌ها (نیاز به سشن روی ریپوی بک‌اند).
- صفحه‌ی wp-admin برای «درخواست‌های سخنرانی» و مدیریت سردبیری.
- صفحه‌بندی سرور برای لیست سخنرانان/درخواست‌ها/اعضای ابتکار.

## فرض‌ها

- کاربر مالک هر دو ریپو است و WP روی 8082 در دسترس است (تأیید شد: namespace → 200).
- در هر مغایرت، **کد** مرجع است.
- هیچ تغییری در بک‌اند در این پلن انجام نمی‌شود.
