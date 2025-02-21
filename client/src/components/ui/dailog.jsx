import { useState } from "react";

export function Dialog({ children }) {
  return <div>{children}</div>;
}

export function DialogTrigger({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-green-500 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}

export function DialogContent({ children, isOpen, onClose }) {
  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        {children}
        <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
          Close
        </button>
      </div>
    </div>
  ) : null;
}
