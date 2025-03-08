import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 modal-enter-active">
      <div 
        className="bg-white dark:bg-dark-surface p-6 rounded-lg w-full max-w-md shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Confirm Deletion</h2>
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
          Are you sure you want to delete {itemName ? <strong>{itemName}</strong> : 'this item'}?
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button 
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
