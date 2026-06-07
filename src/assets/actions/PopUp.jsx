import React, { useEffect } from "react";
import "../css/PopUp.css";

/**
 * Componente de Pop-up / Toast para Feedback de Operações
 * @param {boolean} isOpen - Controla a visibilidade do pop-up
 * @param {string} message - O texto que será exibido
 * @param {string} type - O tipo do pop-up: 'success', 'error' ou 'info'
 * @param {function} onClose - Função para fechar o pop-up automaticamente ou no clique
 */
export const Popup = ({ isOpen, message, type = "info", onClose }) => {
  
  // Efeito para fechar o pop-up automaticamente após 4 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer); // Limpa o timer se o componente desmontar
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Definição de ícones dinâmicos com base no tipo
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case "error":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  return (
    <div className={`popup-toast-container ${type}`}>
      <div className="popup-icon">{getIcon()}</div>
      <div className="popup-content">
        <p className="popup-message">{message}</p>
      </div>
      <button onClick={onClose} className="popup-close-btn" aria-label="Fechar">
        &times;
      </button>
      {/* Barra de progresso visual do tempo restante */}
      <div className="popup-progress-bar" />
    </div>
  );
};