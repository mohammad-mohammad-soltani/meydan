"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { insertMention, mentionToken } from "../mention";
import { kindNames, messageTitle, type WorkGroup, type WorkKind, type WorkMessage, type WorkUser } from "../types";
import { bareHandle, fa } from "../utils";
import { Person } from "./Avatar";
import { ChIcon, type ChIconName } from "@/features/chat/components/ChIcon";
import { Icon, type IconName } from "./Icon";
import { MemberList } from "./MemberPicker";
import { PeoplePicker } from "./PeoplePicker";
import { Popover } from "./Popover";
import { Quote } from "./bubbles/Quote";
import { VoiceRecorderBar } from "@/features/chat/components/VoiceRecorderBar";
import { uploadChatAttachment } from "@/features/chat/services/chat.service";
import { useVoiceRecorder, type VoiceClip } from "@/features/chat/voice/useVoiceRecorder";
import { voiceRecordingSupported } from "@/features/chat/voice/voice-utils";

type RichKind = Exclude<WorkKind, "text">;
type PickerKind = "assign" | "tag" | "audience";

/** Reference menu: four types with the reference's own pastel hues. */
const TYPES: { kind: RichKind; icon: IconName; ch: ChIconName; label: string; color: string }[] = [
  { kind: "task", icon: "task", ch: "task", label: "وظیفه", color: "#6ee7b7" },
  { kind: "meeting", icon: "meeting", ch: "cal", label: "جلسه", color: "#7ab8ff" },
  { kind: "announcement", icon: "announcement", ch: "ann", label: "اعلان سنجاق‌شده", color: "#fcd34d" },
  { kind: "poll", icon: "poll", ch: "poll", label: "نظرسنجی", color: "#b9a3ff" },
];
const EMOJIS = ["😀", "😂", "😍", "🥳", "👍", "👏", "🙏", "❤️", "🔥", "✅", "🤝", "🎉", "💚", "😔", "🤔", "📌"];

const HINT: Record<RichKind, string> = {
  task: "متن پایین، توضیح وظیفه است. مسئول‌ها و تگ‌شده‌ها اعلان می‌گیرند.",
  meeting: "برای همه اعضا اعلان جلسه فرستاده می‌شود؛ با انتخاب افراد، جلسه خصوصی می‌شود.",
  announcement: "اعضا با «دیدم» تأیید می‌کنند و اسمشان در فهرست دیده‌ها می‌آید.",
  poll: "هر عضو یک رأی دارد.",
};

function dueDaysToISO(days: string): string {
  const n = parseInt(days, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

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
  const [emoji, setEmoji] = useState(false);
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
  const [voiceBusy, setVoiceBusy] = useState(false);
  const sendVoiceRef = useRef<(clip: VoiceClip) => Promise<void>>(async () => undefined);
  const voice = useVoiceRecorder({ onLimit: (clip) => { if (clip) void sendVoiceRef.current(clip); } });
  const canRecord = typeof window !== "undefined" && voiceRecordingSupported();
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

  async function sendVoice(clip: VoiceClip) {
    if (!allowed || voiceBusy) return;
    setError("");
    setVoiceBusy(true);
    try {
      const uploaded = await uploadChatAttachment(clip.file);
      const payload: Record<string, unknown> = {
        kind: "text",
        body: "",
        attachment: { id: uploaded.id, name: clip.file.name, voice: true, duration: clip.duration, waveform: clip.waveform },
      };
      if (reply) payload.reply_to_id = Number(reply.id);
      await send({ ...payload, client_id: crypto.randomUUID() }, reply);
      cancelReply();
    } catch (e) {
      setError(e instanceof Error ? e.message : "ارسال پیام صوتی انجام نشد");
    } finally {
      setVoiceBusy(false);
    }
  }
  useEffect(() => {
    sendVoiceRef.current = sendVoice;
  });
  async function finishVoice() {
    const clip = await voice.stop();
    if (clip) await sendVoice(clip);
  }

  function addEmoji(e: string) {
    const el = bodyRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + e + body.slice(end));
    setEmoji(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + e.length, start + e.length);
    });
  }

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
        due_at: dueDaysToISO(due),
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
      <div className="ch-jn">
        <span>برای قبول وظیفه، اعلام حضور و پاسخ دادن به این کار بپیوندید.</span>
        <button type="button" disabled={parentBusy} onClick={onJoin}>
          من پای‌کارم
        </button>
      </div>
    );

  // Members never post by default: they react and interact with managers' messages. Replies exist only when the owner turns them on.
  if (!manager && !work.members_can_reply)
    return (
      <div className="ch-jn ch-ro">
        <span>
          <Icon name="lock" size={14} /> در این کار فقط مدیر و ادمین‌ها پیام می‌گذارند؛ شما می‌توانید واکنش بدهید و روی پیام‌ها تعامل کنید.
        </span>
      </div>
    );

  const typeMeta = rich ? TYPES.find((t) => t.kind === rich)! : null;
  const hasText = !!body.trim() || !!rich;
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
          <div className="att-h mk-h">
            <b>{rich === "poll" ? "نظرسنجی جدید" : rich === "announcement" ? "اعلان جدید" : `${kindNames[rich]} جدید`}</b>
            <button type="button" onClick={() => setKind("text")} aria-label="بستن">
              <ChIcon name="x" size={18} />
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
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      placeholder="تعداد روز"
                      aria-label="مهلت انجام وظیفه (تعداد روز)"
                      value={due}
                      onChange={(e) => setDue(e.target.value.replace(/[^0-9]/g, ""))}
                    />
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
            <button type="button" className="mk-ok" disabled={sending} onClick={() => void submit()}>
              ثبت در گروه
            </button>
          </div>
        </div>
      ) : null}

      {menu && manager && !reply ? (
        <div className="tmenu ch-mn" role="menu" aria-label="افزودن به گفتگو">
          {TYPES.map((t) => (
            <button
              key={t.kind}
              type="button"
              role="menuitem"
              style={{ "--c": t.color } as CSSProperties}
              onClick={() => {
                setKind(t.kind);
                setMenu(false);
                requestAnimationFrame(() => titleRef.current?.focus());
              }}
            >
              <span>
                <ChIcon name={t.ch} size={19} />
              </span>
              <b>{t.label}</b>
            </button>
          ))}
        </div>
      ) : null}

      {voice.recording ? <VoiceRecorderBar elapsed={voice.elapsed} levels={voice.levels} onCancel={voice.cancel} onSend={() => void finishVoice()} /> : null}
      <div hidden={voice.recording} className={`cbar ch-cf ${hasText ? "has" : ""}`}>
        {manager && !reply ? (
          <button ref={plusRef} type="button" className={`plus ch-pl ${menu ? "on" : ""}`} aria-label="وظیفه، جلسه، اعلان یا نظرسنجی" aria-expanded={menu} onClick={() => { setMenu((v) => !v); setEmoji(false); }}>
            <ChIcon name="plus" size={22} />
          </button>
        ) : null}
        <span className="emo-wrap">
          <button type="button" className="ch-pl" aria-label="انتخاب شکلک" aria-expanded={emoji} disabled={!allowed} onClick={() => { setEmoji((v) => !v); setMenu(false); }}>
            <ChIcon name="smile" size={22} />
          </button>
          {emoji ? (
            <div role="dialog" aria-label="انتخاب شکلک" className="emo-pop">
              {EMOJIS.map((e) => (
                <button key={e} type="button" aria-label={`افزودن ${e}`} onClick={() => addEmoji(e)}>
                  {e}
                </button>
              ))}
            </div>
          ) : null}
        </span>
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
        {hasText ? (
          <button type="button" className="send ch-sd" disabled={!allowed || sending} aria-label="ارسال" onClick={() => void submit()}>
            <ChIcon name="send" size={20} />
          </button>
        ) : (
          <button type="button" className="ch-pl ch-mc" disabled={!manager || !canRecord || voice.phase === "starting" || voiceBusy} onClick={() => void voice.start()} title={manager ? "ضبط پیام صوتی" : undefined} aria-label="ضبط پیام صوتی">
            <ChIcon name="mic" size={22} />
          </button>
        )}
      </div>

      {voice.error ? <div className="cnote err" role="alert">{voice.error}</div> : null}
      {voiceBusy ? <div className="cnote">در حال ارسال پیام صوتی…</div> : null}
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
