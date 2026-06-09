// src/components/admin/ConfirmModal.jsx
import { IClose } from "./AdminIcons.jsx";

export default function ConfirmModal({ msg, onConfirm, onClose, loading }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__title">Confirmar exclusão</span>
          <button className="modal__x" onClick={onClose}><IClose /></button>
        </div>
        <div className="modal__body">
          <div className="modal__warn">⚠️ {msg}</div>
        </div>
        <div className="modal__footer">
          <button className="btn-sec" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn-del" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
