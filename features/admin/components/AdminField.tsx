"use client";

import { Children, cloneElement, isValidElement, type ReactNode, type ReactElement, type HTMLAttributes } from "react";
import { fieldClass, labelClass } from "./styles";

/**
 * One labelled form control.
 *
 * The per-field error wiring is the point: a 422 from the API carries
 * `error.fields` (`{ phone: "taken" }`), the form maps that reason to a Persian
 * sentence and hands it here, and the input gets `aria-invalid` plus
 * `aria-describedby` pointing at the message. Without this the rejection would
 * only appear as a banner and the admin would have to guess which box is wrong.
 */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className = "",
}: {
  label: string;
  /** Must match the control's id so the `<label>` is a real label. */
  htmlFor: string;
  /** A short format hint, e.g. "مثال: ۰۹۱۲۳۴۵۶۷۸۹". */
  hint?: string;
  /** Persian message for a rejected value. */
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined;

  const controls = Children.map(children, (child) => {
    if (!isValidElement(child) || !["input", "textarea", "select"].includes(String(child.type))) return child;
    const control = child as ReactElement<HTMLAttributes<HTMLElement>>;
    return cloneElement(control, {
      "aria-invalid": error ? true : control.props["aria-invalid"],
      "aria-required": required || undefined,
      "aria-describedby": [control.props["aria-describedby"], errorId ?? hintId].filter(Boolean).join(" ") || undefined,
    });
  });
  return (
    <div className={`admin-field min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className={labelClass}>{label}{required ? <span className="ms-1 text-danger" aria-hidden="true">*</span> : null}</label>
      <div className="admin-field-control mt-1">{controls}</div>
      {error ? <p id={errorId} role="alert" className="admin-field-error mt-1 text-xs text-danger-foreground">{error}</p> : hint ? <p id={hintId} className="admin-field-hint mt-1 text-[11px] leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * The error/description ids a control inside `AdminField` must reference. Small
 * helper so every call site wires `aria-describedby` the same way.
 */
export function describedBy(id: string, error?: string | null, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export { fieldClass };

/** A checkbox row, used for `verified` and `featured`. */
export function AdminCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-control border border-border bg-surface px-3 py-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
      />
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-xs font-black text-foreground-secondary">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[10px] leading-5 text-muted-foreground">
            {description}
          </span>
        ) : null}
      </label>
    </div>
  );
}
