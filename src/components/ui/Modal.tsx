"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

// Accessible dialog built on the native <dialog> element: focus trapping,
// Escape handling and inert background come from the platform.

export function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = "Close"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      aria-label={title}
    >
      <div className="modal-card animate-in">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-1 -mt-1 rounded-full p-2 text-ink-soft hover:bg-muted hover:text-ink"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>,
    document.body
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  busy,
  children
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  busy?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title}>
      {description && <p className="mb-4 text-sm leading-relaxed text-ink-soft">{description}</p>}
      {children}
      <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          onClick={onClose}
          disabled={busy}
          className="press min-h-11 rounded-btn border border-line bg-surface px-5 text-[15px] font-medium text-ink hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={cn(
            "press inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-ink px-5 text-[15px] font-medium text-white hover:bg-black disabled:opacity-60"
          )}
        >
          {busy && <Icon name="loader-circle" className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
