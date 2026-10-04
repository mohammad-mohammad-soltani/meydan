"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import "../reference-profile.css";

export function ProfileImageViewer({ src, name, round, onClose }: { src: string; name: string; round: boolean; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [onClose]);
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`تصویر ${name}`} className="reference-profile-image-viewer" onClick={onClose}>
      <button type="button" autoFocus aria-label="بستن تصویر" className="reference-profile-image-close" onClick={onClose}><X className="h-6 w-6" /></button>
      <figure className={`reference-profile-image-figure ${round ? "round" : ""}`} onClick={(event) => event.stopPropagation()}>
        <div className="reference-profile-image-frame">{round ? <Image src={src} alt={name} fill sizes="(max-width: 550px) 84vw, 460px" className="object-cover" /> : <Image src={src} alt={name} width={1100} height={700} sizes="(max-width: 1170px) 94vw, 1100px" className="object-contain" />}</div>
        <figcaption>{name}</figcaption>
      </figure>
    </div>, document.body,
  );
}
