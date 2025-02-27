import React from 'react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-4">Are you sure you want to delete <strong>{selectedItem?.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-500 px-4 py-2 rounded text-white" onClick={handleCloseDeleteModal}>Cancel</button>
              <button className="bg-red-500 px-4 py-2 rounded text-white" onClick={handleConfirmDelete}>Confirm Delete</button>
            </div>
          </div>
        </div>
      
  );
};

export default DeleteConfirmationModal;
