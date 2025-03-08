// components/Modal.js
import React, { useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';

const Modal = ({ isOpen, onClose, children, maxWidth = "max-w-3xl", fullHeight = false }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    
    document.addEventListener('keydown', handleEsc);
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto'; // Restore scrolling when unmounted
    };
  }, [isOpen, onClose]);

  // Render nothing if not open (without CSSTransition)
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm modal-enter-active"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className={`bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full ${maxWidth} mx-auto overflow-hidden
                   text-light-text-primary dark:text-dark-text-primary
                   transform transition-all duration-300 scale-100 ${fullHeight ? 'h-[90vh]' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;