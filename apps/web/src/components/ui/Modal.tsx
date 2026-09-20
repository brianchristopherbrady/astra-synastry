import { useId } from "react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useModalDialog } from "./useModalDialog.js";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useModalDialog(open);
  const titleId = useId();

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="ds-dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
        <div className="dialog-heading">
          <h2 id={titleId} className="text-lg font-semibold text-stardust">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="icon-button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
    </dialog>
  );
}
