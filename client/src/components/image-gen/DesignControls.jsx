import React from 'react';
import { motion } from 'framer-motion';

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
  application,
  setApplication,
  textileFinish,
  setTextileFinish,
  patternScale,
  setPatternScale,
  patternDensity,
  setPatternDensity,
  personalization,
  setPersonalization,
  personalizationText,
  setPersonalizationText,
  textPlacement,
  setTextPlacement,
  updatePromptFromMetadata,
  SAMPLE_PATTERNS,
  SEAMLESS_PATTERN_TYPES,
  DESIGN_STYLES,
  TOWEL_APPLICATIONS,
  TEXTILE_FINISHES,
  PERSONALIZATION_OPTIONS,
  TEXT_PLACEMENT_OPTIONS
}) => {
  return (
<div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-2 h-[calc(100vh-100px)] overflow-auto flex flex-col">
<h3 className="text-xs font-semibold text-white mb-2 sticky top-0">Design Controls</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {/* Advanced Prompt Toggle */}
        <div className="flex items-center justify-between bg-[#2A2F38] p-1.5 rounded">
          <label className="text-[10px] font-medium text-gray-400">Advanced Mode</label>
          <button 
            onClick={() => {
              setAdvancedPromptMode(!advancedPromptMode);
              if (!advancedPromptMode) {
                // When switching to advanced mode, initialize with current prompt
                updatePromptFromMetadata();
              }
            }}
            className={`relative inline-flex h-3.5 w-7 items-center rounded-full transition-colors ${advancedPromptMode ? 'bg-blue-500' : 'bg-gray-600'}`}
          >
            <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${advancedPromptMode ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {advancedPromptMode ? (
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-medium text-gray-400">Custom Prompt</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500 h-32 resize-none"
                placeholder="Enter your complete custom prompt here..."
              />
              <div className="bg-[#2A2F38] p-2 rounded mt-2">
                <p className="text-[9px] text-gray-400 mb-1">Advanced Mode Tips:</p>
                <ul className="text-[9px] text-gray-500 space-y-1 list-disc pl-3">
                  <li>Describe the pattern style, colors, and details explicitly</li>
                  <li>Include terms like "seamless", "tileable", "repeating pattern" for better results</li>
                  <li>Specify the scale and density of the pattern</li>
                  <li>Mention "textile design" or "fabric pattern" for appropriate context</li>
                  <li>Add technical details like "high resolution", "sharp details", etc.</li>
                </ul>
              </div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => {
                    // Get the current structured prompt as a starting point
                    updatePromptFromMetadata();
                  }}
                  className="text-[10px] px-2 py-1 bg-[#2A2F38] text-gray-300 hover:bg-[#3A4149] rounded"
                >
                  Load Structured Prompt
                </button>
                <button
                  onClick={() => setCustomPrompt("")}
                  className="text-[10px] px-2 py-1 bg-[#2A2F38] text-gray-300 hover:bg-[#3A4149] rounded"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Optional Pattern Type Selection in Advanced Mode */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Base Pattern Type (Optional)</label>
              <select 
                value={seamlessType}
                onChange={(e) => setSeamlessType(e.target.value)}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {SEAMLESS_PATTERN_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-gray-500 mt-0.5">
                {SEAMLESS_PATTERN_TYPES.find(t => t.id === seamlessType)?.description}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pattern Style */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Pattern</label>
              <select 
                value={selectedPattern.id}
                onChange={(e) => {
                  const pattern = SAMPLE_PATTERNS.find(p => p.id === e.target.value);
                  setSelectedPattern(pattern);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {SAMPLE_PATTERNS.map(pattern => (
                  <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
                ))}
              </select>
            </div>

            {/* Custom Pattern Description */}
            {selectedPattern.id === "custom" && (
              <div>
                <label className="text-[10px] font-medium text-gray-400">Custom Pattern Description</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    updatePromptFromMetadata();
                  }}
                  className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500 h-12 resize-none"
                  placeholder="Describe your custom pattern..."
                />
              </div>
            )}

            {/* Seamless Pattern Type */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Seamless Type</label>
              <select 
                value={seamlessType}
                onChange={(e) => {
                  setSeamlessType(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {SEAMLESS_PATTERN_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-gray-500 mt-0.5">
                {SEAMLESS_PATTERN_TYPES.find(t => t.id === seamlessType)?.description}
              </p>
            </div>

            {/* Style */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Technique</label>
              <select 
                value={designStyle}
                onChange={(e) => {
                  setDesignStyle(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {DESIGN_STYLES.map(style => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Color Scheme</label>
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., deep royal blue, pastel pink"
              />
            </div>

            {/* Application */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Application</label>
              <select 
                value={application}
                onChange={(e) => {
                  setApplication(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {TOWEL_APPLICATIONS.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
            </div>

            {/* Textile Finish */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Finish</label>
              <select 
                value={textileFinish}
                onChange={(e) => {
                  setTextileFinish(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {TEXTILE_FINISHES.map(finish => (
                  <option key={finish} value={finish}>{finish}</option>
                ))}
              </select>
            </div>

            {/* Pattern Scale */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Pattern Scale</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {["small", "medium", "large"].map(scale => (
                  <button
                    key={scale}
                    onClick={() => {
                      setPatternScale(scale);
                      updatePromptFromMetadata();
                    }}
                    className={`text-[10px] py-1 rounded capitalize ${
                      patternScale === scale 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-[#2A2F38] text-gray-300 hover:bg-[#3A4149]'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Density */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Pattern Density</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {["sparse", "balanced", "dense"].map(density => (
                  <button
                    key={density}
                    onClick={() => {
                      setPatternDensity(density);
                      updatePromptFromMetadata();
                    }}
                    className={`text-[10px] py-1 rounded capitalize ${
                      patternDensity === density 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-[#2A2F38] text-gray-300 hover:bg-[#3A4149]'
                    }`}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            {/* Personalization */}
            <div>
              <label className="text-[10px] font-medium text-gray-400">Personalization</label>
              <select 
                value={personalization}
                onChange={(e) => {
                  setPersonalization(e.target.value);
                  updatePromptFromMetadata();
                }}
                className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
              >
                {PERSONALIZATION_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Personalization Text */}
            {personalization !== "None" && (
              <div>
                <label className="text-[10px] font-medium text-gray-400">Personalization Text</label>
                <input
                  type="text"
                  value={personalizationText}
                  onChange={(e) => {
                    setPersonalizationText(e.target.value);
                    updatePromptFromMetadata();
                  }}
                  className="w-full px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter text to add..."
                />
                <select 
                  value={textPlacement}
                  onChange={(e) => {
                    setTextPlacement(e.target.value);
                    updatePromptFromMetadata();
                  }}
                  className="w-full mt-1 px-2 py-1 bg-[#2A2F38] border border-[#3A4149] rounded text-gray-100 text-[10px] focus:ring-1 focus:ring-blue-500"
                >
                  {TEXT_PLACEMENT_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DesignControls; 