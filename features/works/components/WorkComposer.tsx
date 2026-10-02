"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { insertMention, mentionToken } from "../mention";
import { kindNames, messageTitle, type WorkGroup, type WorkKind, type WorkMessage, type WorkUser } from "../types";
import { bareHandle, fa } from "../utils";
import { Person } from "./Avatar";
import { Icon, type IconName } from "./Icon";
import { MemberList } from "./MemberPicker";
import { PeoplePicker } from "./PeoplePicker";
import { Popover } from "./Popover";
import { Quote } from "./bubbles/Quote";

type RichKind = Exclude<WorkKind, "text">;
type PickerKind = "assign" | "tag" | "audience";

const TYPES: { kind: RichKind; icon: IconName; label: string; sub: string; color: string }[] = [
  { kind: "task", icon: "task", label: "وظیفه", sub: "کار با مسئول، مهلت و زیرکار", color: "var(--ok)" },
  { kind: "meeting", icon: "meeting", label: "جلسه", sub: "زمان، مکان و اعلام حضور", color: "var(--accent)" },
  { kind: "announcement", icon: "announcement", label: "اعلان", sub: "ابلاغیه با تأیید «دیدم»", color: "var(--s2)" },
  { kind: "poll", icon: "poll", label: "نظرسنجی", sub: "پرسش با چند گزینه", color: "#8b5cf6" },
];

const HINT: Record<RichKind, string> = {
  task: "متن پایین، توضیح وظیفه است. مسئول‌ها و تگ‌شده‌ها اعلان می‌گیرند.",
  meeting: "برای همه اعضا اعلان جلسه فرستاده می‌شود؛ با انتخاب افراد، جلسه خصوصی می‌شود.",
  announcement: "اعضا با «دیدم» تأیید می‌کنند و اسمشان در فهرست دیده‌ها می‌آید.",
  poll: "هر عضو یک رأی دارد.",
};

export type ComposerSeed = { kind?: RichKind; assignee?: WorkUser; mention?: WorkUser };

export type ComposerHandle = { apply: (seed: ComposerSeed) => void };

/** Telegram-like composer: managers get the «+» type menu, members can only reply. */
export const WorkComposer = forwardRef<
  ComposerHandle,
  {
    work: WorkGroup;
    reply: WorkMessage | null;
    cancelReply: () => void;
    send: (body: Record<string, unknown>, replyTo: WorkMessage | null) => Promise<unknown>;
    onJoin: () => void;
    busy: boolean;
  }
>(function WorkComposer({ work, reply, cancelReply, send, onJoin, busy: parentBusy }, handleRef) {
  const manager = !!work.viewer.can_post;
  const [kind, setKind] = useState<WorkKind>("text");
  const [menu, setMenu] = useState(false);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [assignees, setAssignees] = useState<WorkUser[]>([]);
  const [tags, setTags] = useState<WorkUser[]>([]);
  const [audience, setAudience] = useState<WorkUser[]>([]);
  const [typed, setTyped] = useState<WorkUser[]>([]);
  const [due, setDue] = useState("");
  const [capacity, setCapacity] = useState("");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("normal");
  const [items, setItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [when, setWhen] = useState("");
  const [place, setPlace] = useState("");
  const [agenda, setAgenda] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [options, setOptions] = useState(["", ""]);
  const [picker, setPicker] = useState<PickerKind | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [caret, setCaret] = useState<{ target: "body" | "title"; pos: number } | null>(null);
  const [hl, setHl] = useState(0);
  const [suggest, setSuggest] = useState<WorkUser[]>([]);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);
  const chipRefs = { assign: useRef<HTMLButtonElement>(null), tag: useRef<HTMLButtonElement>(null), audience: useRef<HTMLButtonElement>(null) };
  const retry = useRef<{ fingerprint: string; id: string } | null>(null);

  const allowed = manager || (work.viewer.joined && !!reply);
  const rich = manager && !reply && kind !== "text" ? (kind as RichKind) : null;
  const token = caret ? mentionToken(caret.target === "body" ? body : title, caret.pos) : null;

  // Seeds from the members tab: «واگذاری وظیفه» / «@ تگ» (applied imperatively, not through effects).
  useImperativeHandle(handleRef, () => ({
    apply(seed: ComposerSeed) {
      if (seed.kind) {
        setKind(seed.kind);
        setMenu(false);
        requestAnimationFrame(() => titleRef.current?.focus());
      }
      if (seed.assignee) setAssignees([seed.assignee]);
      const mention = seed.mention;
      if (mention) {
        const handle = "@" + bareHandle(mention) + " ";
        setBody((b) => (b ? b + (b.endsWith(" ") ? "" : " ") : "") + handle);
        setTyped((v) => (v.some((u) => u.id === mention.id) ? v : [...v, mention]));
        requestAnimationFrame(() => bodyRef.current?.focus());
      }
    },
  }));

  // Replying focuses the text box (the rich form is hidden while replying).
  useEffect(() => {
    if (reply) bodyRef.current?.focus();
  }, [reply]);

  const autoGrow = () => {
    const t = bodyRef.current;
    if (t) {
      t.style.height = "24px";
      t.style.height = Math.min(120, t.scrollHeight) + "px";
    }
  };
  useEffect(autoGrow, [body]);

  function pickMention(user: WorkUser) {
    if (!token || !caret) return;
    const handle = "@" + bareHandle(user);
    const source = caret.target === "body" ? body : title;
    const next = insertMention(source, token, handle);
    const pos = token.start + handle.length + 1;
    if (caret.target === "body") setBody(next);
    else setTitle(next);
    setTyped((v) => (v.some((u) => u.id === user.id) ? v : [...v, user]));
    setCaret(null);
    setSuggest([]);
    requestAnimationFrame(() => {
      const el = caret.target === "body" ? bodyRef.current : titleRef.current;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    });
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, target: "body" | "title") {
    if (token && suggest.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHl((v) => Math.min(suggest.length - 1, v + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHl((v) => Math.max(0, v - 1));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(suggest[Math.min(hl, suggest.length - 1)]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setCaret(null);
        return;
      }
    }
    if (e.key === "Escape" && reply) {
      cancelReply();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (target === "title") bodyRef.current?.focus();
      else void submit();
    }
  }

  function reset() {
    retry.current = null;
    setKind("text");
    setBody("");
    setTitle("");
    setAssignees([]);
    setTags([]);
    setAudience([]);
    setTyped([]);
    setDue("");
    setCapacity("");
    setPriority("normal");
    setItems([]);
    setItemInput("");
    setWhen("");
    setPlace("");
    setAgenda("");
    setUrgent(false);
    setPinned(false);
    setOptions(["", ""]);
    setCaret(null);
    cancelReply();
  }

  async function submit() {
    if (!allowed || sending) return;
    setError("");
    const text = body.trim();
    const effective: WorkKind = reply ? "text" : kind;
    if (effective === "text" && !text) {
      setError(reply ? "متن پاسخ را بنویسید." : "پیام را بنویسید.");
      return;
    }
    if (effective !== "text" && !title.trim()) {
      setError(effective === "poll" ? "پرسش را بنویسید." : `عنوان ${kindNames[effective]} را بنویسید.`);
      titleRef.current?.focus();
      return;
    }
    if (effective === "poll" && options.filter((o) => o.trim()).length < 2) {
      setError("حداقل دو گزینه بنویسید.");
      return;
    }

    const haystack = `${title} ${body}`;
    const mentionIds = [...new Set([...tags, ...typed.filter((u) => haystack.includes("@" + bareHandle(u)))].map((u) => Number(u.id)))];
    const payload: Record<string, unknown> = { kind: effective, body: text, mention_ids: mentionIds };
    if (reply) payload.reply_to_id = Number(reply.id);
    if (effective === "task")
      payload.task = {
        title: title.trim(),
        priority,
        capacity: Math.max(0, parseInt(capacity.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))), 10) || 0),
        due_at: due ? new Date(due).toISOString() : "",
        items,
        assignee_ids: assignees.map((u) => Number(u.id)),
      };
    if (effective === "meeting")
      payload.meeting = {
        title: title.trim(),
        when: when.trim(),
        place: place.trim(),
        agenda: agenda.trim(),
        ...(audience.length ? { private_user_ids: audience.map((u) => Number(u.id)) } : {}),
      };
    if (effective === "announcement") payload.announcement = { title: title.trim(), urgent, pinned };
    if (effective === "poll") payload.poll = { title: title.trim(), options: options.map((o) => o.trim()).filter(Boolean) };

    // Same payload retried (network blip) keeps its client id → the server de-duplicates.
    const fingerprint = JSON.stringify(payload);
    if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, id: crypto.randomUUID() };
    setSending(true);
    try {
      await send({ ...payload, client_id: retry.current.id }, reply);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال انجام نشد");
    } finally {
      setSending(false);
    }
  }

  const chip = (k: PickerKind, label: string, value: WorkUser[], placeholder: string, cls: string) => (
    <button ref={chipRefs[k]} type="button" className={`pp ${cls}`} onClick={() => setPicker(picker === k ? null : k)}>
      <b>{label}</b>
      <span className="pv">
        {value.length ? value.map((u) => <Person key={u.id} user={u} />) : <span className="ph">{placeholder}</span>}
      </span>
      <Icon name="chev" size={13} />
    </button>
  );

  if (!work.viewer.joined && !manager)
    return (
      <div className="r-foot">
        <div className="member-note">
          <span>
            <Icon name="users" size={16} /> برای قبول وظیفه، اعلام حضور و پاسخ دادن به این کار بپیوندید.
          </span>
          <button type="button" className="btn primary" disabled={parentBusy} onClick={onJoin} style={{ padding: "7px 16px" }}>
            من پای‌کارم
          </button>
        </div>
      </div>
    );

  const typeMeta = rich ? TYPES.find((t) => t.kind === rich)! : null;
  const placeholder = !allowed
    ? "برای پاسخ، روی پیام بزنید یا دکمه پاسخ را بزنید"
    : reply
      ? "پاسخ شما… (@ برای تگ)"
      : rich
        ? "توضیح (اختیاری)"
        : "پیام… (@ برای تگ)";

  return (
    <div className="r-foot">
      {reply ? (
        <div className="reply-bar">
          <Icon name="reply" size={18} />
          <Quote
            reply={{ id: reply.id, kind: reply.kind, title: reply.kind === "text" ? "" : messageTitle(reply), body: reply.body, sender_name: reply.sender?.name ?? "", sender_label: reply.sender?.work_label }}
            onJump={() => undefined}
          />
          <button type="button" className="icon-btn" onClick={cancelReply} aria-label="لغو پاسخ">
            ×
          </button>
        </div>
      ) : null}

      {rich && typeMeta ? (
        <div className="att" style={{ "--tc": typeMeta.color } as CSSProperties}>
          <div className="att-h">
            <Icon name={typeMeta.icon} size={15} />
            {rich === "poll" ? "نظرسنجی تازه" : `${kindNames[rich]} تازه`}
            <span className="sp" />
            <button type="button" onClick={() => setKind("text")} aria-label="بستن">
              ×
            </button>
          </div>
          <div className="att-b">
            <input
              ref={titleRef}
              className="t-in"
              placeholder={rich === "poll" ? "پرسش" : `عنوان ${kindNames[rich]}`}
              value={title}
              autoComplete="off"
              aria-label={rich === "poll" ? "پرسش" : "عنوان"}
              onChange={(e) => {
                setTitle(e.target.value);
                setCaret({ target: "title", pos: e.target.selectionStart ?? e.target.value.length });
              }}
              onClick={(e) => setCaret({ target: "title", pos: e.currentTarget.selectionStart ?? 0 })}
              onKeyDown={(e) => onKey(e, "title")}
            />
            {rich === "task" ? (
              <>
                <div className="cmp-people">
                  {chip("assign", "مسئول", assignees, "انتخاب مسئول", "assign")}
                  {chip("tag", "تگ", tags, "انتخاب افراد", "tag")}
                </div>
                <div className="cmp-extra">
                  <label className="due-field">
                    <span>مهلت</span>
                    <input type="datetime-local" aria-label="مهلت انجام وظیفه" value={due} onChange={(e) => setDue(e.target.value)} />
                  </label>
                  <input inputMode="numeric" aria-label="جای داوطلب" placeholder="جای داوطلب (۰ = نامحدود)" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                  <span className="seg">
                    {(["high", "normal", "low"] as const).map((p) => (
                      <button type="button" key={p} className={priority === p ? "on" : ""} onClick={() => setPriority(p)}>
                        {p === "high" ? "فوری" : p === "normal" ? "عادی" : "کم"}
                      </button>
                    ))}
                  </span>
                </div>
                <div className="cmp-check">
                  {items.map((c, i) => (
                    <span className="ci" key={i}>
                      ☐ {c}
                      <button type="button" aria-label="حذف" onClick={() => setItems((v) => v.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    placeholder="+ زیرکار (Enter)"
                    aria-label="زیرکار"
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (itemInput.trim()) {
                          setItems((v) => [...v, itemInput.trim()]);
                          setItemInput("");
                        }
                      }
                    }}
                  />
                </div>
              </>
            ) : null}
            {rich === "meeting" ? (
              <>
                <div className="cmp-people">{chip("audience", "جلسه خصوصی", audience, "همه اعضا", "tag")}</div>
                <div className="cmp-extra">
                  <input placeholder="زمان، مثلاً فردا ۱۸:۰۰" aria-label="زمان" value={when} onChange={(e) => setWhen(e.target.value)} />
                  <input placeholder="مکان" aria-label="مکان" value={place} onChange={(e) => setPlace(e.target.value)} />
                  <input placeholder="دستور جلسه" aria-label="دستور جلسه" value={agenda} onChange={(e) => setAgenda(e.target.value)} />
                </div>
              </>
            ) : null}
            {rich === "announcement" ? (
              <>
                <div className="cmp-people">{chip("tag", "تگ", tags, "انتخاب افراد", "tag")}</div>
                <div className="cmp-extra">
                  <label className="check" style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
                    فوری و مهم
                  </label>
                  <label className="check" style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                    سنجاق شود
                  </label>
                </div>
              </>
            ) : null}
            {rich === "poll" ? (
              <div className="cmp-extra" style={{ flexDirection: "column", alignItems: "stretch" }}>
                {options.map((o, i) => (
                  <span className="opt-row" key={i}>
                    <input
                      placeholder={`گزینه ${fa(i + 1)}${i < 2 ? " (الزامی)" : ""}`}
                      aria-label={`گزینه ${i + 1}`}
                      value={o}
                      onChange={(e) => setOptions((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                    />
                    {i > 1 ? (
                      <button type="button" aria-label="حذف گزینه" onClick={() => setOptions((v) => v.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    ) : null}
                  </span>
                ))}
                {options.length < 20 ? (
                  <button type="button" className="edit-pp" style={{ alignSelf: "flex-start" }} onClick={() => setOptions((v) => [...v, ""])}>
                    + گزینه
                  </button>
                ) : null}
              </div>
            ) : null}
            <small className="hint2">{HINT[rich]}</small>
          </div>
        </div>
      ) : null}

      {menu && manager && !reply ? (
        <div className="tmenu" role="menu" aria-label="افزودن به گفتگو">
          {TYPES.map((t) => (
            <button
              key={t.kind}
              type="button"
              role="menuitem"
              style={{ "--tc": t.color } as CSSProperties}
              onClick={() => {
                setKind(t.kind);
                setMenu(false);
                requestAnimationFrame(() => titleRef.current?.focus());
              }}
            >
              <span className="ti">
                <Icon name={t.icon} size={17} />
              </span>
              <span>
                <b>{t.label}</b>
                <small>{t.sub}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="cbar">
        {manager && !reply ? (
          <button ref={plusRef} type="button" className={`plus ${menu ? "on" : ""}`} aria-label="وظیفه، جلسه، اعلان یا نظرسنجی" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <Icon name="plus" size={20} weight={2.2} />
          </button>
        ) : null}
        <div className="cinput">
          <textarea
            ref={bodyRef}
            rows={1}
            disabled={!allowed}
            placeholder={placeholder}
            aria-label="متن پیام"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setCaret({ target: "body", pos: e.target.selectionStart });
            }}
            onClick={(e) => setCaret({ target: "body", pos: e.currentTarget.selectionStart })}
            onKeyUp={(e) => {
              if (!["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key)) setCaret({ target: "body", pos: e.currentTarget.selectionStart });
            }}
            onKeyDown={(e) => onKey(e, "body")}
          />
        </div>
        <button type="button" className="send" disabled={!allowed || sending} aria-label="ارسال" onClick={() => void submit()}>
          <Icon name="send" size={18} weight={2} />
        </button>
      </div>

      {error ? (
        <div className="cnote err" role="alert">
          {error}
        </div>
      ) : !manager && !reply ? (
        <div className="cnote">
          <Icon name="lock" size={13} /> در این کار فقط مدیر و ادمین‌ها پیام می‌گذارند؛ شما می‌توانید پاسخ و واکنش بدهید.
        </div>
      ) : null}

      {token && allowed ? (
        <Popover anchor={caret?.target === "title" ? titleRef : bodyRef} onClose={() => setCaret(null)}>
          <div className="pk-h">
            <b>اشاره به…</b>
            <small>↑ ↓ برای انتخاب · Enter برای تأیید</small>
          </div>
          <MemberList workId={work.id} query={token.query} mode="single" highlight={hl} onToggle={pickMention} onItems={(u) => { setSuggest(u); setHl(0); }} />
        </Popover>
      ) : null}

      {picker ? (
        <PeoplePicker
          anchor={chipRefs[picker]}
          workId={work.id}
          title={picker === "assign" ? "مسئول وظیفه" : picker === "audience" ? "افراد جلسه خصوصی" : "تگ کردن افراد"}
          sub={
            picker === "assign"
              ? "به ترتیب کمترین بار کاری؛ مسئول‌ها اعلان می‌گیرند"
              : picker === "audience"
                ? "فقط این افراد و مدیران جلسه را می‌بینند"
                : "تگ‌شده‌ها در جریان قرار می‌گیرند ولی مسئول نیستند"
          }
          value={picker === "assign" ? assignees : picker === "audience" ? audience : tags}
          onChange={picker === "assign" ? setAssignees : picker === "audience" ? setAudience : setTags}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
});
