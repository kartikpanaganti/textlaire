import React, { createContext, useState, useContext } from 'react';
import Modal from '../components/common/Modal';

// Create Notification Context
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    content: '',
    type: 'info',
    onConfirm: null,
    showConfirmButton: false,
    confirmText: 'Confirm',
    showCancelButton: false,
    cancelText: 'Cancel',
    size: 'md'
  });

  // Show a modal
  const showModal = ({
    title,
    content,
    type = 'info',
    onConfirm = null,
    showConfirmButton = false,
    confirmText = 'Confirm',
    showCancelButton = false,
    cancelText = 'Cancel',
    size = 'md'
  }) => {
    setModalState({
      isOpen: true,
      title,
      content,
      type,
      onConfirm,
      showConfirmButton,
      confirmText,
      showCancelButton,
      cancelText,
      size
    });
  };

  // Close the modal
  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  // Show an info modal
  const showInfo = (title, content) => {
    showModal({
      title,
      content,
      type: 'info'
    });
  };

  // Show a success modal
  const showSuccess = (title, content) => {
    showModal({
      title,
      content,
      type: 'success'
    });
  };

  // Show a warning modal
  const showWarning = (title, content) => {
    showModal({
      title,
      content,
      type: 'warning'
    });
  };

  // Show an error modal
  const showError = (title, content) => {
    showModal({
      title,
      content,
      type: 'error'
    });
  };

  // Show a confirmation modal
  const showConfirmation = (title, content, onConfirm) => {
    showModal({
      title,
      content,
      type: 'warning',
      onConfirm,
      showConfirmButton: true,
      showCancelButton: true
    });
  };

  // Handle confirm action
  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    closeModal();
  };

  return (
    <NotificationContext.Provider
      value={{
        showModal,
        closeModal,
        showInfo,
        showSuccess,
        showWarning,
        showError,
        showConfirmation
      }}
    >
      {children}

      {/* Modal Component */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        type={modalState.type}
        size={modalState.size}
      >
        <div className="mb-4">
          {typeof modalState.content === 'string' ? (
            <p>{modalState.content}</p>
          ) : (
            modalState.content
          )}
        </div>

        {(modalState.showConfirmButton || modalState.showCancelButton) && (
          <div className="flex justify-end space-x-2">
            {modalState.showCancelButton && (
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                onClick={closeModal}
              >
                {modalState.cancelText}
              </button>
            )}
            {modalState.showConfirmButton && (
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={handleConfirm}
              >
                {modalState.confirmText}
              </button>
            )}
          </div>
        )}
      </Modal>
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

export default NotificationProvider;
