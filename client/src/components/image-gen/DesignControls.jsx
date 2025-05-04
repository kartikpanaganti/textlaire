import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DesignControls = ({
  advancedPromptMode,
  setAdvancedPromptMode,
  customPrompt,
  setCustomPrompt,
  selectedPattern,
  setSelectedPattern,
  seamlessType,
  setSeamlessType,
  designStyle,
  setDesignStyle,
  customColor,
  setCustomColor,
  updatePromptFromMetadata,
  SAMPLE_PATTERNS,
  SEAMLESS_PATTERN_TYPES,
  DESIGN_STYLES
}) => {
  const [showPatternInfo, setShowPatternInfo] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(null);
  const [colorPresets, setColorPresets] = useState([
    "blue and white", "earth tones", "pastel colors", "monochrome", 
    "vibrant rainbow", "black and gold", "navy and coral"
  ]);
  
  // Helper to display the info modal for a pattern
  const showPatternDetails = (pattern) => {
    setCurrentPattern(pattern);
    setShowPatternInfo(true);
  };

  return (
    <div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-3 h-full overflow-auto flex flex-col">
      <div className="flex justify-between items-center sticky top-0 bg-[#1A1D24] pb-2 z-10">
        <h3 className="text-sm font-semibold text-white">Design Controls</h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setAdvancedPromptMode(!advancedPromptMode);
            if (!advancedPromptMode) {
              updatePromptFromMetadata();
            }
          }}
          className="flex items-center gap-1 px-2 py-1 bg-[#2A2F38] rounded text-[11px] text-white hover:bg-[#3A4149]"
        >
          {advancedPromptMode ? "Simple Mode" : "Advanced Mode"}
          <div className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors ${advancedPromptMode ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${advancedPromptMode ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </div>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {advancedPromptMode ? (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-white">Custom Prompt</label>
                <div className="flex gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updatePromptFromMetadata()}
                    className="text-[10px] px-2 py-1 bg-[#2A2F38] text-white hover:bg-[#3A4149] rounded"
                  >
                    <span className="flex items-center gap-1 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Load
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCustomPrompt("")}
                    className="text-[10px] px-2 py-1 bg-[#2A2F38] text-white hover:bg-[#3A4149] rounded"
                  >
                    <span className="flex items-center gap-1 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </span>
                  </motion.button>
                </div>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded text-white text-xs focus:ring-1 focus:ring-blue-500 h-40 resize-none"
                placeholder="Enter your complete custom prompt here..."
              />
              <div className="bg-[#2A2F38] p-2 rounded mt-2">
                <p className="text-[11px] text-blue-400 mb-1 font-medium">Prompt Tips:</p>
                <ul className="text-[10px] text-white space-y-1 list-disc pl-3">
                  <li>Describe pattern style, colors, and details specifically</li>
                  <li>Include terms like "seamless", "tileable", "repeating pattern"</li>
                  <li>Mention "textile design" or "fabric pattern" for context</li>
                  <li>Specify color schemes: "blue and white" or "earth tones"</li>
                  <li>Add quality terms: "high resolution", "detailed", "photorealistic"</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white mb-1 block">Base Pattern Type</label>
              <select 
                value={seamlessType}
                onChange={(e) => setSeamlessType(e.target.value)}
                className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                {SEAMLESS_PATTERN_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-white mt-1 italic">
                {SEAMLESS_PATTERN_TYPES.find(t => t.id === seamlessType)?.description}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Pattern Selection with Visual Grid */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-white">Pattern Style</label>
                <span className="text-[10px] text-white">Selected: {selectedPattern.name}</span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                {SAMPLE_PATTERNS.slice(0, 8).map(pattern => (
                  <motion.button
                    key={pattern.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedPattern(pattern);
                      updatePromptFromMetadata();
                    }}
                    className={`aspect-square rounded-lg overflow-hidden relative border-2 transition-all ${
                      selectedPattern.id === pattern.id 
                        ? 'border-blue-500 ring-2 ring-blue-500/50' 
                        : 'border-[#3A4149] hover:border-gray-400'
                    }`}
                    title={pattern.name}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                    <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white z-20 font-medium">{pattern.name}</div>
                    <div className={`w-full h-full flex items-center justify-center bg-[#2A2F38] ${
                      pattern.id === 'roses' ? 'bg-gradient-to-br from-pink-900/30 to-gray-900' :
                      pattern.id === 'sun-moon' ? 'bg-gradient-to-br from-blue-900/30 to-amber-900/30' :
                      pattern.id === 'phoenix' ? 'bg-gradient-to-br from-amber-900/30 to-red-900/30' :
                      pattern.id === 'dragons' ? 'bg-gradient-to-br from-green-900/30 to-gray-900' :
                      pattern.id === 'butterflies' ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30' :
                      pattern.id === 'waves' ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30' :
                      pattern.id === 'peacock' ? 'bg-gradient-to-br from-teal-900/30 to-purple-900/30' :
                      'bg-gradient-to-br from-gray-800 to-gray-900'
                    }`}>
                      <span className="text-lg opacity-50 text-white">
                        {pattern.id === 'roses' ? '🌹' :
                         pattern.id === 'sun-moon' ? '☀️' :
                         pattern.id === 'phoenix' ? '🔥' :
                         pattern.id === 'dragons' ? '🐉' :
                         pattern.id === 'butterflies' ? '🦋' :
                         pattern.id === 'waves' ? '🌊' :
                         pattern.id === 'peacock' ? '🦚' :
                         pattern.id === 'lotus' ? '🪷' : '🎨'}
                      </span>
                    </div>
                  </motion.button>
                ))}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Find 'custom' pattern or fallback to default
                    const customPattern = SAMPLE_PATTERNS.find(p => p.id === 'custom') || 
                                          {id: 'custom', name: 'Custom Design', prompt: 'custom textile pattern'};
                    setSelectedPattern(customPattern);
                    updatePromptFromMetadata();
                  }}
                  className={`aspect-square rounded-lg overflow-hidden bg-[#2A2F38] relative border-2 flex flex-col items-center justify-center ${
                    selectedPattern.id === 'custom'
                      ? 'border-blue-500 ring-2 ring-blue-500/50' 
                      : 'border-[#3A4149] hover:border-gray-400'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-[9px] text-white mt-1">Custom</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Open a modal with all patterns
                    // This is a placeholder - you could show a modal with all patterns
                    alert('This would show all available patterns');
                  }}
                  className="aspect-square rounded-lg overflow-hidden bg-[#2A2F38] flex flex-col items-center justify-center border-2 border-[#3A4149] hover:border-gray-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                  <span className="text-[9px] text-white mt-1">More</span>
                </motion.button>
              </div>
              
              {/* Custom Pattern Description */}
              {selectedPattern.id === "custom" && (
                <div className="mt-2">
                  <label className="text-[10px] font-medium text-white block mb-1">Custom Pattern Description</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value);
                      updatePromptFromMetadata();
                    }}
                    className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded text-white text-xs focus:ring-1 focus:ring-blue-500 h-16 resize-none"
                    placeholder="Describe your custom pattern..."
                  />
                </div>
              )}
            </div>

            {/* Seamless Pattern Type */}
            <div>
              <label className="text-xs font-medium text-white block mb-1">Seamless Type</label>
              <div className="grid grid-cols-2 gap-2">
                {SEAMLESS_PATTERN_TYPES.map(type => (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSeamlessType(type.id);
                      updatePromptFromMetadata();
                    }}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                      seamlessType === type.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-[#2A2F38] text-white hover:bg-[#3A4149]'
                    }`}
                  >
                    <span className="text-xs font-medium text-white">{type.name}</span>
                    <span className="text-[9px] text-center mt-1 opacity-80 text-white">{type.description}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Design Style / Technique */}
            <div>
              <label className="text-xs font-medium text-white block mb-1">Design Technique</label>
              <select 
                value={designStyle}
                onChange={(e) => {
                  setDesignStyle(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                {DESIGN_STYLES.map(style => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-white mt-1 italic">
                {DESIGN_STYLES.find(s => s.id === designStyle)?.technique || ''}
              </p>
            </div>

            {/* Color Scheme with Presets */}
            <div>
              <label className="text-xs font-medium text-white block mb-1">Color Scheme</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {colorPresets.map((color, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCustomColor(color);
                      updatePromptFromMetadata();
                    }}
                    className={`px-2 py-1 rounded text-[10px] transition-all ${
                      customColor === color 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-[#2A2F38] text-white hover:bg-[#3A4149]'
                    }`}
                  >
                    {color}
                  </motion.button>
                ))}
              </div>
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-3 py-2 bg-[#2A2F38] border border-[#3A4149] rounded text-white text-xs focus:ring-1 focus:ring-blue-500"
                placeholder="Custom color scheme (e.g., deep blue with gold accents)"
              />
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Pattern Info Modal */}
      <AnimatePresence>
        {showPatternInfo && currentPattern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowPatternInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1D24] rounded-lg max-w-md w-full p-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">{currentPattern.name}</h3>
              <p className="text-sm text-white mb-4">{currentPattern.prompt}</p>
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPatternInfo(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignControls; 