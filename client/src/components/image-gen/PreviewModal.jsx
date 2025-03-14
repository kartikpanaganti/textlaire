import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PreviewModal = ({ 
  showPreview, 
  previewImage, 
  closePreview, 
  setTileCount, 
  setPreviewRotation 
}) => {
  return (
    <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 overflow-auto"
          onClick={closePreview}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#1A1D24] rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-square md:aspect-auto md:h-[80vh] relative">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              
              {/* Enhanced Preview Controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                <button
                  onClick={() => setTileCount(4)}
                  className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white text-xs"
                >
                  2×2
                </button>
                <button
                  onClick={() => setTileCount(9)}
                  className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white text-xs"
                >
                  3×3
                </button>
                <button
                  onClick={() => setTileCount(16)}
                  className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white text-xs"
                >
                  4×4
                </button>
                <div className="h-4 w-px bg-gray-500/50"></div>
                <button
                  onClick={() => setPreviewRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-md bg-[#2A2F38]/80 hover:bg-[#3A4149]/80 text-white text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={closePreview}
                className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PreviewModal; 