import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastNotification = ({ showToast, toastMessage }) => {
  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg text-xs z-50"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification; 