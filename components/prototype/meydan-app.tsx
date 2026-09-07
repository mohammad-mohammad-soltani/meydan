"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icon";
import { ViewAllPodcasts } from "./views/ViewAllPodcasts";
import { ViewChat } from "./views/ViewChat";
import { ViewCombinedProfile } from "./views/ViewCombinedProfile";
import { ViewContent } from "./views/ViewContent";
import { ViewDirectChat } from "./views/ViewDirectChat";
import { ViewFeed } from "./views/ViewFeed";
import { ViewFullCompose } from "./views/ViewFullCompose";
import { ViewFullPost } from "./views/ViewFullPost";
import { ViewMap } from "./views/ViewMap";
import { ViewSpeakers } from "./views/ViewSpeakers";

type ActionTarget = HTMLElement & { value?: string };

const parseArgs = (source: string, target: ActionTarget): string[] => {
  const body = source.slice(source.indexOf("(") + 1, source.lastIndexOf(")"));
  const values: string[] = []; let current = ""; let quote = ""; let depth = 0;
  for (const char of body) {
    if (quote) { current += char; if (char === quote) quote = ""; continue; }
    if (char === "\"" || char === "'") { quote = char; current += char; continue; }
    if (char === "(") depth++; if (char === ")") depth--;
    if (char === "," && depth === 0) { values.push(current.trim()); current = ""; } else current += char;
  }
  if (current.trim()) values.push(current.trim());
  return values.map((value) => {
    if (value === "this") return target;
    if (value === "this.value") return target.value ?? "";
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('\"') && value.endsWith('\"'))) return value.slice(1, -1);
    if (value === "true") return "true"; if (value === "false") return "false";
    return value;
  }) as string[];
};

export default function MeydanApp() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const show = (id: string) => { root.querySelectorAll<HTMLElement>(".app-view").forEach((item) => item.classList.add("hidden")); const next = root.querySelector<HTMLElement>("#" + id); if (next) { next.classList.remove("hidden"); next.classList.remove("view-enter"); void next.offsetWidth; next.classList.add("view-enter"); } root.querySelectorAll<HTMLElement>("[data-nav-view]").forEach((item) => item.classList.toggle("nav-active", item.dataset.navView === id)); root.querySelector<HTMLElement>("#subTabs")?.style.setProperty("display", id === "view-feed" ? "block" : "none"); root.querySelector<HTMLElement>("#homeSubTabs")?.style.setProperty("display", id === "view-feed" ? "flex" : "none"); root.querySelector<HTMLElement>("#bottomNavBar")?.classList.toggle("hidden", ["view-direct-chat", "view-full-post", "view-full-compose"].includes(id)); root.querySelector<HTMLElement>("#floatingComposeBtn")?.classList.toggle("hidden", ["view-direct-chat", "view-full-post", "view-full-compose"].includes(id)); };
    const toggle = (id: string) => root.querySelector<HTMLElement>(`#${id}`)?.classList.toggle("hidden");
    const text = (id: string, value: string) => { const node = root.querySelector<HTMLElement>(`#${id}`); if (node) node.textContent = value; };
    const action = (name: string, args: string[], target: ActionTarget) => {
      switch (name) {
        case "switchView": show(args[0]); break;
        case "switchHomeTab": { const on = args[0] === "foryou"; root.querySelector("#feed-content-foryou")?.classList.toggle("hidden", !on); root.querySelector("#feed-content-following")?.classList.toggle("hidden", on); root.querySelector("#home-tab-foryou")?.classList.toggle("home-subtab-active", on); root.querySelector("#home-tab-following")?.classList.toggle("home-subtab-active", !on); } break;
        case "filterFeed": { root.querySelectorAll(".pill-tab").forEach((item) => item.classList.remove("active-pill")); root.querySelector(`#pill-${args[0]}`)?.classList.add("active-pill"); root.querySelectorAll<HTMLElement>(".feed-item").forEach((item) => item.classList.toggle("hidden", args[0] !== "all" && !item.classList.contains(`feed-${args[0]}`))); } break;
        case "toggleTheme": document.documentElement.classList.toggle("dark"); break;
        case "toggleSearchModal": toggle("searchModal"); break;
        case "closeModal": root.querySelector<HTMLElement>(`#${args[0]}`)?.classList.add("hidden"); break;
        case "openDetailModal": text("modalTitle", args[0]); text("modalDesc", args[1]); root.querySelector("#detailModal")?.classList.remove("hidden"); break;
        case "openAudioModal": text("audioModalTitle", args[0]); text("audioModalSpeaker", args[1]); text("audioModalLocation", args[2]); text("audioModalDesc", args[3]); root.querySelector("#audioDetailModal")?.classList.remove("hidden"); break;
        case "openMediaModal": text("mediaModalTitle", args[0]); text("mediaModalOutlet", `منتشر شده در: ${args[1]}`); root.querySelector("#mediaModal")?.classList.remove("hidden"); break;
        case "showMediaReflection": text("mediaModalTitle", `انعکاس در ${args[0]}`); text("mediaModalOutlet", args[0]); text("mediaModalDetailText", args[1]); root.querySelector("#mediaModal")?.classList.remove("hidden"); break;
        case "openSpeakerBooking": text("selectedSpeakerName", args[0]); root.querySelector("#speakerRequestPanel")?.classList.remove("hidden"); break;
        case "closeSpeakerRequestPanel": root.querySelector<HTMLElement>("#speakerRequestPanel")?.classList.add("hidden"); break;
        case "toggleAccordion": toggle(args[0]); break;
        case "toggleChatMediaMenu": toggle("chatMediaDropdown"); break;
        case "toggleTweetAction": target.classList.toggle(args[1] === "like" ? "heart-active" : "text-emerald-500"); break;
        case "toggleFollowBtn": target.textContent = target.textContent?.includes("دنبال کردن") ? "دنبال‌شده" : "دنبال کردن"; break;
        case "shareTweet": navigator.clipboard?.writeText(args[0]); break;
        case "playAudio": alert(`در حال پخش آنلاین دم: «${args[0]}»...`); break;
        case "alert": alert(args[0]); break;
        case "openDirectChatPage": text("directChatTitle", args[0]); text("directChatHandle", args[1]); show("view-direct-chat"); break;
        case "switchProfileSubtab": root.querySelector("#subtab-content-resume")?.classList.toggle("hidden", args[0] !== "resume"); root.querySelector("#subtab-content-square")?.classList.toggle("hidden", args[0] === "resume"); break;
        case "switchChatSection": root.querySelector("#chat-section-messages")?.classList.toggle("hidden", args[0] !== "messages"); root.querySelector("#chat-section-notifs")?.classList.toggle("hidden", args[0] === "messages"); break;
        case "submitNewTweet": alert("روایت شما با موفقیت ثبت شد."); show("view-feed"); break;
        case "submitPostComment": alert("نظر شما با موفقیت ثبت شد."); break;
        case "attachChatMedia": alert(`پیوست ${args[0]} انتخاب شد.`); break;
        case "openFullPostPage": text("fullPostAuthor", args[0]); text("fullPostHandle", args[1]); text("fullPostContent", args[2]); text("fullPostOutlet", `انتشار در: ${args[3]}`); show("view-full-post"); break;
        case "selectProvinceFromDropdown": text("currentProvinceName", args[0]); break;
        case "filterSquaresByCity": alert(`رادار بر روی «${args[0]}» متمرکز شد.`); break;
        case "sendDirectChatMessage": { const input = root.querySelector<HTMLInputElement>("#directChatMessageInput"); if (input?.value.trim()) { const area = root.querySelector("#directChatMessagesArea"); if (area) area.insertAdjacentHTML("beforeend", `<div class=\"flex justify-end\"><div class=\"bg-brand-red text-white p-3 rounded-2xl max-w-[82%]\">${input.value}</div></div>`); input.value = ""; } } break;
        default: break;
      }
    };
    const click = (event: Event) => { const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]"); if (!target) return; const element = target as ActionTarget; (element.dataset.action ?? "").split(";").map((command) => command.trim()).forEach((command) => { const match = command.match(/^([\w$]+)\(/); if (match) action(match[1], parseArgs(command, element), element); }); };
    const input = (event: Event) => { const target = event.target as ActionTarget; const raw = target.dataset.inputAction; if (!raw) return; if (raw.includes("filterSpeakersList")) root.querySelectorAll<HTMLElement>(".speaker-card").forEach((card) => card.style.display = card.textContent?.toLowerCase().includes((target.value ?? "").toLowerCase()) ? "flex" : "none"); if (raw.includes("autoExpandTextarea")) { target.style.height = "auto"; target.style.height = `${target.scrollHeight}px`; } };
    const change = (event: Event) => { const target = event.target as ActionTarget; const raw = target.dataset.changeAction; if (!raw) return; const match = raw.match(/^([\w$]+)\(/); if (match) action(match[1], [target.value ?? ""], target); };
    root.addEventListener("click", click); root.addEventListener("input", input); root.addEventListener("change", change);
    show("view-feed");
    return () => { root.removeEventListener("click", click); root.removeEventListener("input", input); root.removeEventListener("change", change); };
  }, []);

  return (
<div ref={rootRef}>
  {/* کانتینر اصلی */}
  <div className="w-full min-h-screen flex justify-center mx-auto">
    {/* ستون ناوبری راست (دسکتاپ) */}
    <aside className="hidden lg:flex flex-col w-64 p-4 sticky top-0 h-screen border-l border-slate-200 dark:border-slate-800/80 justify-between shrink-0 bg-white dark:bg-[#070a0f]">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-red flex items-center justify-center text-white font-black text-lg">
            <Icon name="flame" className="w-6 h-6"  />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">میدانِ خیابان</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">شبکه سراسری میادین ایران</p>
          </div>
        </div>
        <nav className="space-y-1.5 text-sm font-bold">
          <button data-action="switchView('view-feed')" data-nav-view="view-feed" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="home" className="w-5 h-5"  />
            <span>خانه و روایت‌ها</span>
          </button>
          <button data-action="switchView('view-content')" data-nav-view="view-content" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="folder-kanban" className="w-5 h-5"  />
            <span>بسته محتوا و منابر</span>
          </button>
          <button data-action="switchView('view-speakers')" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="mic" className="w-5 h-5"  />
            <span>اعزام سخنران</span>
          </button>
          <button data-action="switchView('view-map')" data-nav-view="view-map" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="map" className="w-5 h-5"  />
            <span>نقشه زنده و رادار میادین</span>
          </button>
          <button data-action="switchView('view-chat')" data-nav-view="view-chat" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="message-square" className="w-5 h-5"  />
            <span>پیام‌ها و اعلان‌ها</span>
          </button>
          <button data-action="switchView('view-combined-profile')" data-nav-view="view-combined-profile" className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition">
            <Icon name="user-check" className="w-5 h-5"  />
            <span>هویت و پایگاه من</span>
          </button>
        </nav>
        <button data-action="switchView('view-full-compose')" className="w-full bg-brand-red hover:bg-red-700 text-white font-black py-3 rounded-2xl transition flex items-center justify-center gap-2">
          <Icon name="pen-tool" className="w-4 h-4"  />
          <span>ثبت روایت جدید</span>
        </button>
      </div>
      <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs">م.ر</div>
          <div>
            <div className="font-bold text-xs">محمدصادق رضایی</div>
            <div className="text-[10px] text-slate-400">میدان انقلاب تهران</div>
          </div>
        </div>
        <button data-action="toggleTheme()" className="p-2 rounded-xl text-slate-500 hover:text-amber-500"><Icon name="sun" className="w-4 h-4"  /></button>
      </div>
    </aside>
    {/* ستون مرکزی اصلی */}
    <div className="w-full max-w-xl bg-white dark:bg-[#070a0f] min-h-screen h-[100dvh] flex flex-col border-x border-slate-200 dark:border-slate-800/80 relative transition-colors duration-150" id="mainAppShell">
      {/* نوار هدر: مخفی در دسکتاپ و سیستم با کلاس lg:hidden و فقط فعال در موبایل */}
      <header className="lg:hidden sticky top-0 bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur-md z-30 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white font-black text-sm">
            <Icon name="flame" className="w-4 h-4"  />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
              میدانِ خیابان
              <span className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">شبکه همبستگی و روایت میادین ایران</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button data-action="toggleSearchModal()" className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-red transition flex items-center gap-1 text-xs font-bold">
            <Icon name="search" className="w-4 h-4"  />
            <span>جستجو</span>
          </button>
          <button data-action="toggleTheme()" className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 transition">
            <i id="theme-icon" data-lucide="sun" className="w-4 h-4" />
          </button>
        </div>
      </header>
      {/* تب‌های فید: موقعیت در دسکتاپ top-0 و در موبایل top-[53px] */}
      <div id="homeSubTabs" className="flex border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#070a0f]/95 text-xs font-bold sticky top-0 lg:top-0 z-30">
        <button data-action="switchHomeTab('foryou')" id="home-tab-foryou" className="flex-1 py-3 text-center home-subtab-active transition">برای شما</button>
        <button data-action="switchHomeTab('following')" id="home-tab-following" className="flex-1 py-3 text-center text-slate-500 dark:text-slate-400 transition">دنبال‌شده‌ها</button>
      </div>
      <div id="subTabs" className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a0f] sticky top-[41px] lg:top-[41px] z-20">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button data-action="filterFeed('all')" id="pill-all" className="pill-tab active-pill px-4 py-1.5 text-xs font-bold shrink-0">
            همه روایت‌ها
          </button>
          <button data-action="filterFeed('ideas')" id="pill-ideas" className="pill-tab px-4 py-1.5 text-xs font-bold shrink-0 flex items-center gap-1.5">
            <Icon name="star" className="w-3.5 h-3.5 text-amber-500 fill-amber-500"  />
            <span>پژواک (کار خوب)</span>
          </button>
          <button data-action="filterFeed('media')" id="pill-media" className="pill-tab px-4 py-1.5 text-xs font-bold shrink-0 flex items-center gap-1.5">
            <Icon name="newspaper" className="w-3.5 h-3.5 text-slate-400"  />
            <span>بازنشر رسانه‌ای</span>
          </button>
        </div>
      </div>
      {/* محتوای اسکرول‌شونده فید و صفحات */}
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {/* ================= ۱. فید اصلی خانه ================= */}
        <ViewFeed />
        {/* ================= ۲. بخش محتوا ================= */}
        <ViewContent />
        {/* ================= اعزام سخنران ================= */}
        <ViewSpeakers />
        {/* ================= صفحه اختصاصی پادکست‌ها ================= */}
        <ViewAllPodcasts />
        {/* ================= ۳. نقشه زنده SVG ================= */}
        <ViewMap />
        {/* ================= ۴. گفتگوها و اعلان‌ها (شامل انواع اعلان‌های لایک، ریتوییت، پیام و بازتاب) ================= */}
        <ViewChat />
        {/* ================= ۵. بخش هویت و پایگاه من ================= */}
        <ViewCombinedProfile />
        {/* ================= صفحه اختصاصی روایت با نوار فیکس و تراز شده ================= */}
        <ViewFullPost />
        {/* ================= صفحه ثبت روایت جدید ================= */}
        <ViewFullCompose />
        {/* ================= صفحه گفتگو تکی ================= */}
        <ViewDirectChat />
      </main>
      {/* دکمه شناور ارسال روایت در موبایل */}
      <div id="floatingComposeBtn" className="fixed bottom-20 z-40 max-w-xl w-full pointer-events-none px-4 flex justify-end lg:hidden">
        <button data-action="switchView('view-full-compose')" className="pointer-events-auto w-12 h-12 rounded-full bg-brand-red hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition transform active:scale-95">
          <Icon name="pen-tool" className="w-5 h-5"  />
        </button>
      </div>
      {/* نوار ناوبری پایین صفحه (موبایل) */}
      <nav id="bottomNavBar" className="fixed bottom-0 w-full max-w-xl bg-white/95 dark:bg-[#070a0f]/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 py-2 px-3 flex items-center justify-between text-slate-400 z-50 lg:hidden">
        <button data-action="switchView('view-feed')" data-nav-view="view-feed" id="nav-feed" className="flex flex-col items-center gap-1 text-slate-700 dark:text-slate-300 font-bold transition">
          <Icon name="home" className="w-5 h-5"  />
          <span className="text-[9px]">خانه</span>
        </button>
        <button data-action="switchView('view-content')" data-nav-view="view-content" id="nav-content" className="flex flex-col items-center gap-1 hover:text-brand-red transition">
          <Icon name="folder-kanban" className="w-5 h-5"  />
          <span className="text-[9px]">محتوا</span>
        </button>
        <button data-action="switchView('view-map')" data-nav-view="view-map" id="nav-map" className="flex flex-col items-center gap-1 hover:text-brand-red transition">
          <Icon name="map" className="w-5 h-5"  />
          <span className="text-[9px]">نقشه زنده</span>
        </button>
        <button data-action="switchView('view-chat')" data-nav-view="view-chat" id="nav-chat" className="flex flex-col items-center gap-1 hover:text-brand-red transition">
          <Icon name="message-square" className="w-5 h-5"  />
          <span className="text-[9px]">گفتگو</span>
        </button>
        <button data-action="switchView('view-combined-profile')" data-nav-view="view-combined-profile" id="nav-combined-profile" className="flex flex-col items-center gap-1 hover:text-brand-red transition">
          <Icon name="user-check" className="w-5 h-5"  />
          <span className="text-[9px]">هویت و پایگاه</span>
        </button>
      </nav>
    </div>
    {/* ستون ترندهای چپ (دسکتاپ) */}
    <aside className="hidden lg:flex flex-col w-72 p-4 sticky top-0 h-screen border-r border-slate-200 dark:border-slate-800/80 space-y-4 shrink-0 overflow-y-auto no-scrollbar bg-white dark:bg-[#070a0f]">
      <div className="relative">
        <Icon name="search" className="w-4 h-4 text-slate-400 absolute right-3 top-3"  />
        <input type="text" placeholder="جستجو در ترندها..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pr-9 pl-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none" />
      </div>
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Icon name="trending-up" className="w-4 h-4 text-brand-red"  />
            ترندهای داغ میادین
          </h3>
          <span className="text-[10px] text-slate-400">زنده</span>
        </div>
        <div className="space-y-3 pt-1 text-[11px] divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="pt-2">
            <div className="text-slate-400 text-[10px]">۱ · موضوع روز</div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">#فرمانده_کل_قوا</div>
            <div className="text-slate-400 text-[10px]">۱۲۸ هزار روایت</div>
          </div>
          <div className="pt-2">
            <div className="text-slate-400 text-[10px]">۲ · میدان انقلاب تهران</div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">طومار ۵۰ متری تجدید بیعت</div>
            <div className="text-slate-400 text-[10px]">۴۵ هزار امضا</div>
          </div>
          <div className="pt-2">
            <div className="text-slate-400 text-[10px]">۳ · ابتکار میدانی یزد</div>
            <div className="font-bold text-slate-900 dark:text-white text-xs">ایستگاه شارژ اضطراری موبایل</div>
            <div className="text-slate-400 text-[10px]">۲۱ میدان مجری</div>
          </div>
        </div>
      </div>
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-blue-500 font-bold">
          <Icon name="newspaper" className="w-4 h-4"  />
          <span>روزنامه عصر ایرانیان</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          صفحه نخست شماره فردا به حماسه خروش شب دوازدهم میادین و هم‌نوایی یکدست سراسری اختصاص یافت[cite: 1].
        </p>
      </div>
    </aside>
  </div>
  {/* مودال جستجو */}
  <div id="searchModal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center hidden p-4 pt-16">
    <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-4 relative shadow-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Icon name="search" className="w-4 h-4 text-brand-red"  /> جستجوی هوشمند در میادین و روایت‌ها
        </span>
        <button data-action="toggleSearchModal()" className="text-slate-400 hover:text-white"><Icon name="x" className="w-5 h-5"  /></button>
      </div>
      <input type="text" id="ajaxSearchInput" data-input-action="handleAjaxSearch(this.value)" placeholder="نام میدان، شهر، هشتگ یا سخنران..." className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-red" />
      <div id="searchResultsContainer" className="space-y-2 max-h-60 overflow-y-auto no-scrollbar text-xs">
        <div className="text-[10px] text-slate-400 font-bold">داغ‌ترین جستجوها:</div>
        <div className="flex flex-wrap gap-1.5">
          <span data-action="triggerSearchTag('#میدان_انقلاب')" className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-brand-red hover:text-white transition">#میدان_انقلاب</span>
          <span data-action="triggerSearchTag('حاج میثم مطیعی')" className="bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-brand-red hover:text-white transition">حاج میثم مطیعی</span>
        </div>
      </div>
    </div>
  </div>
  {/* مودال جزئیات محتوا */}
  <div id="detailModal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
    <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 relative max-h-[88vh] overflow-y-auto">
      <button data-action="closeModal('detailModal')" className="absolute top-4 left-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Icon name="x" className="w-5 h-5"  /></button>
      <h3 id="modalTitle" className="text-sm font-black text-slate-900 dark:text-white leading-snug">عنوان بسته محتوایی</h3>
      <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <p id="modalDesc">متن کامل.</p>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
        <button data-action="alert('دانلود مستقیم آغاز شد.'); closeModal('detailModal');" className="bg-brand-red text-white px-4 py-1.5 rounded-lg font-bold">دانلود مستقیم فایل</button>
        <button data-action="closeModal('detailModal')" className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold">بستن</button>
      </div>
    </div>
  </div>
  {/* مودال صوتی */}
  <div id="audioDetailModal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
    <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 relative max-h-[90vh] overflow-y-auto">
      <button data-action="closeModal('audioDetailModal')" className="absolute top-4 left-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Icon name="x" className="w-5 h-5"  /></button>
      <h3 id="audioModalTitle" className="text-sm font-black text-slate-900 dark:text-white leading-snug">عنوان قطعه صوتی</h3>
      <div id="audioModalSpeaker" className="text-xs text-brand-gold font-bold mt-0.5">گوینده</div>
      <div className="my-3 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1 text-xs">
        <div id="audioModalLocation" className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">میدان انقلاب تهران</div>
      </div>
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <p id="audioModalDesc">توضیحات.</p>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
        <button data-action="alert('دانلود صوت آغاز شد.'); closeModal('audioDetailModal');" className="bg-brand-red text-white px-4 py-1.5 rounded-lg font-bold">دانلود فایل صوتی MP3</button>
        <button data-action="closeModal('audioDetailModal')" className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold">بستن</button>
      </div>
    </div>
  </div>
  {/* مودال انعکاس رسانه */}
  <div id="mediaModal" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
    <div className="bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-5 relative max-h-[85vh] overflow-y-auto">
      <button data-action="closeModal('mediaModal')" className="absolute top-4 left-4 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Icon name="x" className="w-5 h-5"  /></button>
      <span id="mediaModalOutlet" className="text-xs font-bold text-blue-500">خبرگزاری</span>
      <h3 id="mediaModalTitle" className="text-sm font-black text-slate-900 dark:text-white leading-snug mt-1">عنوان خبر</h3>
      <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
        <p id="mediaModalDetailText">این گزارش در رسانه‌ها بازتاب یافته است.</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end text-xs">
        <button data-action="closeModal('mediaModal')" className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg font-bold">بستن</button>
      </div>
    </div>
  </div>
</div>


  );
}
