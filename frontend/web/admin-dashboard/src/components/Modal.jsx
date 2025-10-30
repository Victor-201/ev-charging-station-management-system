import { createPortal } from "react-dom";

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
        {title && <h3 className="text-lg font-semibold text-ev-gunmetal">{title}</h3>}
        <div>{children}</div>
        {footer && <div className="pt-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
