"use client";

import { Children, isValidElement, useId, useRef, useState, type FormEventHandler, type ReactElement, type ReactNode } from "react";
import { ChevronLeft, ListChecks, PenLine, ShieldCheck } from "lucide-react";

type SectionProps = { className?: string; title?: string; "aria-label"?: string };

/** One reading column and a section index keep long create/edit forms navigable. */
export function AdminEditor({ children, className = "", onSubmit, title = "تکمیل اطلاعات", description = "اطلاعات هر بخش را تکمیل کنید و در پایان تغییرات را ذخیره کنید." }: {
  children: ReactNode;
  className?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  title?: string;
  description?: string;
}) {
  const id = useId();
  const root = useRef<HTMLFormElement>(null);
  const [active, setActive] = useState(0);
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<SectionProps>[];
  const notices = items.filter((item) => item.props.className?.includes("admin-form-notice"));
  const actions = items.filter((item) => item.props.className?.includes("admin-form-actions"));
  const sections = items.filter((item) => !notices.includes(item) && !actions.includes(item));

  function goTo(index: number) {
    setActive(index);
    const section = document.getElementById(`${id}-section-${index}`);
    section?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    section?.focus({ preventScroll: true });
  }

  return (
    <form ref={root} className={`admin-form admin-editor ${className}`} onSubmit={onSubmit}>
      <div className="admin-editor-intro"><span className="admin-editor-intro-icon"><PenLine size={21} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div><span className="admin-editor-required">فیلدهای <b>*</b> الزامی‌اند</span></div>
      <div className="admin-editor-layout">
        <aside className="admin-editor-index">
          <div className="admin-editor-index-title"><ListChecks size={18} aria-hidden="true" /><strong>بخش‌های فرم</strong></div>
          <nav aria-label="بخش‌های فرم"><ol>{sections.map((section, index) => <li key={section.key ?? index}><button type="button" aria-current={active === index ? "location" : undefined} onClick={() => goTo(index)}><span>{(index + 1).toLocaleString("fa-IR")}</span><strong>{section.props["aria-label"] ?? section.props.title ?? "اطلاعات تکمیلی"}</strong><ChevronLeft size={14} aria-hidden="true" /></button></li>)}</ol></nav>
          <p className="admin-editor-save-hint"><ShieldCheck size={18} aria-hidden="true" /><span>تغییرات با زدن دکمهٔ ذخیره ثبت می‌شوند.</span></p>
        </aside>
        <div className="admin-editor-content">
          {notices}
          {sections.map((section, index) => <div key={section.key ?? index} id={`${id}-section-${index}`} tabIndex={-1} className="admin-editor-section" onFocusCapture={() => setActive(index)}>{section}</div>)}
        </div>
      </div>
      <div className="admin-editor-footer">{actions}</div>
    </form>
  );
}
