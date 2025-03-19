import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PatternPreview = ({
  image,
  isLoading,
  loadingProgress,
  previewZoom,
  setPreviewZoom,
  previewRotation,
  setPreviewRotation,
  previewLayout,
  setPreviewLayout,
  tileCount,
  setTileCount,
  showTileLines,
  setShowTileLines,
  generateImage,
  saveImage,
  openPreview,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  saturation,
  setSaturation
}) => {
  const singlePreviewRef = useRef(null);
  const tiledPreviewRef = useRef(null);
  const [tiledCanvasUrl, setTiledCanvasUrl] = useState(null);
  const [previewHovered, setPreviewHovered] = useState(false);
  const [tiledHovered, setTiledHovered] = useState(false);
  const [singleZoomLevel, setSingleZoomLevel] = useState(100);
  const [tiledZoomLevel, setTiledZoomLevel] = useState(100);
  const [showSingleZoomOverlay, setShowSingleZoomOverlay] = useState(false);
  const [showTiledZoomOverlay, setShowTiledZoomOverlay] = useState(false);
  
  // Add pan position state
  const [singlePanPosition, setSinglePanPosition] = useState({ x: 0, y: 0 });
  const [tiledPanPosition, setTiledPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPos, setStartPanPos] = useState({ x: 0, y: 0 });

  // Add container bounds state
  const [singleContainerBounds, setSingleContainerBounds] = useState({ width: 0, height: 0 });
  const [tiledContainerBounds, setTiledContainerBounds] = useState({ width: 0, height: 0 });

  // Add fullscreen preview state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenZoom, setFullscreenZoom] = useState(100);
  const [fullscreenPan, setFullscreenPan] = useState({ x: 0, y: 0 });

  // Add custom tile layout states
  const [tileRows, setTileRows] = useState(2); // Default 2 rows
  const [tileColumns, setTileColumns] = useState(2); // Default 2 columns

  // Add state for custom tile input UI
  const [showCustomTileForm, setShowCustomTileForm] = useState(false);
  const [customRowsInput, setCustomRowsInput] = useState('');
  const [customColumnsInput, setCustomColumnsInput] = useState('');

  // Just add back the UI control state
  const [showControls, setShowControls] = useState(false);

  // Add mobile view state
  const [mobileView, setMobileView] = useState('single'); // 'single' or 'tiled'

  // Create tiled canvas with optimized rendering
  const createTiledCanvas = useCallback(() => {
    if (!image || !tiledPreviewRef.current) return;

    const img = new Image();
    
    img.onload = () => {
      // Get container dimensions
      const container = tiledPreviewRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      
      // Create high-resolution canvas with 2x scaling
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use higher device pixel ratio for better quality
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      
      // Calculate the aspect ratio of the original image
      const imgAspectRatio = img.width / img.height;
      
      // Calculate the ideal tile size to maintain aspect ratio
      // We'll use the original image's aspect ratio to determine tile dimensions
      let tileWidth, tileHeight;
      
      // Calculate total width and height based on container and tile counts
      const totalWidth = containerWidth;
      const totalHeight = containerHeight;
      
      // Calculate tile dimensions to maintain aspect ratio
      if (tileColumns / tileRows > imgAspectRatio) {
        // If the grid is wider than the image aspect ratio
        tileWidth = totalWidth / tileColumns;
        tileHeight = tileWidth / imgAspectRatio;
      } else {
        // If the grid is taller than the image aspect ratio
        tileHeight = totalHeight / tileRows;
        tileWidth = tileHeight * imgAspectRatio;
      }
      
      // Set canvas size (physical pixels) - increased size for better quality
      canvas.width = tileWidth * tileColumns * dpr * 2;
      canvas.height = tileHeight * tileRows * dpr * 2;
      
      // Set display size (CSS pixels)
      canvas.style.width = `${tileWidth * tileColumns}px`;
      canvas.style.height = `${tileHeight * tileRows}px`;
      
      // Scale all drawing operations by the device pixel ratio
      ctx.scale(dpr * 2, dpr * 2);
      
      // Set high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Fill background
      ctx.fillStyle = '#2A2F38';
      ctx.fillRect(0, 0, tileWidth * tileColumns, tileHeight * tileRows);
      
      // Draw tiles with slight overlap to prevent seams
      const overlapX = 0.02; // 2% overlap
      const overlapY = 0.02; // 2% overlap
      const drawWidth = tileWidth * (1 + overlapX);
      const drawHeight = tileHeight * (1 + overlapY);
      
      // Draw tiles
      for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileColumns; x++) {
          ctx.save();
          
          // Position at tile center
          const centerX = x * tileWidth + tileWidth / 2;
          const centerY = y * tileHeight + tileHeight / 2;
          ctx.translate(centerX, centerY);
          
          // Apply transformations
          ctx.rotate(previewRotation * Math.PI / 180);
          ctx.scale(previewZoom / 100, previewZoom / 100);
          
          // Draw image centered with high quality settings
          ctx.drawImage(
            img, 
            -drawWidth / 2, 
            -drawHeight / 2, 
            drawWidth, 
            drawHeight
          );
          
          ctx.restore();
        }
      }
      
      // Draw grid lines if enabled
      if (showTileLines) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let i = 0; i <= tileColumns; i++) {
          ctx.beginPath();
          ctx.moveTo(i * tileWidth, 0);
          ctx.lineTo(i * tileWidth, tileHeight * tileRows);
          ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= tileRows; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * tileHeight);
          ctx.lineTo(tileWidth * tileColumns, i * tileHeight);
          ctx.stroke();
        }
      }
      
      // Convert to data URL with maximum quality
      setTiledCanvasUrl(canvas.toDataURL('image/png', 1.0));
    };
    
    img.crossOrigin = 'Anonymous';
    img.src = image;
  }, [image, tileRows, tileColumns, previewZoom, previewRotation, showTileLines, previewLayout]);

  // Update canvas when parameters change
  useEffect(() => {
    if (!image) return;
    createTiledCanvas();
    
    // Handle resize
    const handleResize = () => {
      createTiledCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [image, tileRows, tileColumns, previewZoom, previewRotation, showTileLines, previewLayout, createTiledCanvas]);

  // Download high-quality tiled image
  const downloadTiledImage = () => {
    if (!image) return;
    
    const img = new Image();
    
    img.onload = () => {
      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate the aspect ratio of the original image
      const imgAspectRatio = img.width / img.height;
      
      // Use original image dimensions for high quality
      const baseSize = Math.min(img.width, img.height);
      
      // Calculate tile dimensions to maintain aspect ratio
      let tileWidth, tileHeight;
      
      if (imgAspectRatio >= 1) {
        // Landscape or square image
        tileWidth = baseSize;
        tileHeight = baseSize / imgAspectRatio;
      } else {
        // Portrait image
        tileHeight = baseSize;
        tileWidth = baseSize * imgAspectRatio;
      }
      
      // Set canvas size to fit all tiles
      canvas.width = tileWidth * tileColumns;
      canvas.height = tileHeight * tileRows;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw tiles with slight overlap
      const overlap = 0.01; // 1% overlap
      const drawWidth = tileWidth * (1 + overlap);
      const drawHeight = tileHeight * (1 + overlap);
      
      // Fill background
      ctx.fillStyle = '#2A2F38';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw tiles
      for (let y = 0; y < tileRows; y++) {
        for (let x = 0; x < tileColumns; x++) {
          ctx.save();
          
          // Position at tile center
          const centerX = x * tileWidth + tileWidth / 2;
          const centerY = y * tileHeight + tileHeight / 2;
          ctx.translate(centerX, centerY);
          
          // Apply transformations
          ctx.rotate(previewRotation * Math.PI / 180);
          ctx.scale(previewZoom / 100, previewZoom / 100);
          
          // Draw image centered
          ctx.drawImage(
            img, 
            -drawWidth / 2, 
            -drawHeight / 2, 
            drawWidth, 
            drawHeight
          );
          
          ctx.restore();
        }
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `pattern-tiled-${tileColumns}x${tileRows}.png`;
      link.click();
    };
    
    img.crossOrigin = 'Anonymous';
    img.src = image;
  };

  // Handle mouse wheel zoom for single preview with variable zoom step
  const handleSinglePreviewWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setSingleZoomLevel(prevZoom => {
      // Adjust zoom step based on current zoom level for finer control at high zoom
      const zoomStep = prevZoom > 500 ? 50 : (prevZoom > 200 ? 20 : 10);
      // Remove upper limit to allow infinite zooming, keep minimum limit
      const newZoom = Math.max(50, prevZoom + delta * zoomStep);
      return newZoom;
    });
    setShowSingleZoomOverlay(true);
    setTimeout(() => setShowSingleZoomOverlay(false), 1000);
  }, []);

  // Handle mouse wheel zoom for tiled preview with variable zoom step
  const handleTiledPreviewWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setTiledZoomLevel(prevZoom => {
      // Adjust zoom step based on current zoom level for finer control at high zoom
      const zoomStep = prevZoom > 500 ? 50 : (prevZoom > 200 ? 20 : 10);
      // Remove upper limit to allow infinite zooming, keep minimum limit
      const newZoom = Math.max(50, prevZoom + delta * zoomStep);
      return newZoom;
    });
    setShowTiledZoomOverlay(true);
    setTimeout(() => setShowTiledZoomOverlay(false), 1000);
  }, []);

  // Add wheel event listeners
  useEffect(() => {
    const singlePreview = singlePreviewRef.current;
    const tiledPreview = tiledPreviewRef.current;

    if (singlePreview) {
      singlePreview.addEventListener('wheel', handleSinglePreviewWheel);
    }
    if (tiledPreview) {
      tiledPreview.addEventListener('wheel', handleTiledPreviewWheel);
    }

    return () => {
      if (singlePreview) {
        singlePreview.removeEventListener('wheel', handleSinglePreviewWheel);
      }
      if (tiledPreview) {
        tiledPreview.removeEventListener('wheel', handleTiledPreviewWheel);
      }
    };
  }, [handleSinglePreviewWheel, handleTiledPreviewWheel]);

  // Update container bounds on mount and resize
  useEffect(() => {
    const updateBounds = () => {
      if (singlePreviewRef.current) {
        setSingleContainerBounds({
          width: singlePreviewRef.current.clientWidth,
          height: singlePreviewRef.current.clientHeight
        });
      }
      if (tiledPreviewRef.current) {
        setTiledContainerBounds({
          width: tiledPreviewRef.current.clientWidth,
          height: tiledPreviewRef.current.clientHeight
        });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Calculate bounds for panning
  const calculateBounds = (newX, newY, isPreview) => {
    const bounds = isPreview ? singleContainerBounds : tiledContainerBounds;
    const zoomLevel = isPreview ? singleZoomLevel : tiledZoomLevel;
    
    // Calculate max offset based on zoom level - allows for more panning at higher zoom levels
    const maxOffset = Math.max(0, (zoomLevel / 100 - 1) * bounds.width);
    
    return {
      x: Math.min(Math.max(newX, -maxOffset), maxOffset),
      y: Math.min(Math.max(newY, -maxOffset), maxOffset)
    };
  };

  // Handle mouse down for panning
  const handleMouseDown = (e, isPreview) => {
    if (e.button === 0) { // Left click
      const zoomLevel = isPreview ? singleZoomLevel : tiledZoomLevel;
      if (zoomLevel <= 100) return; // Only pan when zoomed in

      e.preventDefault();
      setIsPanning(true);
      setStartPanPos({
        x: e.clientX - (isPreview ? singlePanPosition.x : tiledPanPosition.x),
        y: e.clientY - (isPreview ? singlePanPosition.y : tiledPanPosition.y)
      });
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = (e, isPreview) => {
    if (isPanning) {
      e.preventDefault();
      const newX = e.clientX - startPanPos.x;
      const newY = e.clientY - startPanPos.y;
      
      const boundedPosition = calculateBounds(newX, newY, isPreview);
      
      if (isPreview) {
        setSinglePanPosition(boundedPosition);
      } else {
        setTiledPanPosition(boundedPosition);
      }
    }
  };

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset pan position when zoom level changes
  useEffect(() => {
    if (singleZoomLevel <= 100) {
      setSinglePanPosition({ x: 0, y: 0 });
    }
  }, [singleZoomLevel]);

  useEffect(() => {
    if (tiledZoomLevel <= 100) {
      setTiledPanPosition({ x: 0, y: 0 });
    }
  }, [tiledZoomLevel]);

  // Add event listeners for panning
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  // Handle fullscreen preview
  const handleFullscreenPreview = (imageUrl) => {
    setFullscreenImage(imageUrl);
    setIsFullscreen(true);
    setFullscreenZoom(100);
    setFullscreenPan({ x: 0, y: 0 });
  };

  // Handle fullscreen wheel zoom with variable zoom step
  const handleFullscreenWheel = useCallback((e) => {
    if (!isFullscreen) return;
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    setFullscreenZoom(prevZoom => {
      // Adjust zoom step based on current zoom level for finer control at high zoom
      const zoomStep = prevZoom > 500 ? 50 : (prevZoom > 200 ? 20 : 10);
      // Remove upper limit to allow infinite zooming, keep minimum limit
      const newZoom = Math.max(50, prevZoom + delta * zoomStep);
      return newZoom;
    });
  }, [isFullscreen]);

  // Handle fullscreen pan
  const handleFullscreenMouseDown = (e) => {
    if (e.button === 0) {
      e.preventDefault();
      setIsPanning(true);
      setStartPanPos({
        x: e.clientX - fullscreenPan.x,
        y: e.clientY - fullscreenPan.y
      });
    }
  };

  const handleFullscreenMouseMove = (e) => {
    if (isPanning) {
      e.preventDefault();
      const newX = e.clientX - startPanPos.x;
      const newY = e.clientY - startPanPos.y;
      setFullscreenPan({ x: newX, y: newY });
    }
  };

  // Add fullscreen event listeners
  useEffect(() => {
    if (isFullscreen) {
      window.addEventListener('wheel', handleFullscreenWheel, { passive: false });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      });
    }
    return () => {
      window.removeEventListener('wheel', handleFullscreenWheel);
    };
  }, [isFullscreen, handleFullscreenWheel]);

  // Image filter style
  const getImageFilters = () => {
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
    };
  };

  // Reset image adjustments
  const resetImageAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  // Update tileCount when rows or columns change
  useEffect(() => {
    // Update the tileCount for backward compatibility
    setTileCount(tileRows * tileColumns);
  }, [tileRows, tileColumns, setTileCount]);

  // Handle custom tile configuration
  const handleCustomTileConfig = () => {
    setShowCustomTileForm(true);
    setCustomRowsInput(tileRows.toString());
    setCustomColumnsInput(tileColumns.toString());
  };
  
  // Apply custom tile configuration
  const applyCustomTileConfig = () => {
    const newRows = parseInt(customRowsInput);
    const newCols = parseInt(customColumnsInput);
    
    if (!isNaN(newRows) && !isNaN(newCols) && 
        newRows >= 1 && newRows <= 10 && 
        newCols >= 1 && newCols <= 10) {
      setTileRows(newRows);
      setTileColumns(newCols);
      setShowCustomTileForm(false);
    }
  };

  return (
<div className="bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg p-2 h-full overflow-visible flex flex-col">
<div className="space-y-1 flex flex-col h-full">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-semibold text-white">Pattern Preview</h3>
          <div className="flex space-x-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateImage}
              disabled={isLoading}
              className={`px-1.5 py-0.5 rounded-md transition-all text-[10px] ${
                isLoading 
                  ? 'bg-[#2A2F38] text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveImage}
              disabled={!image}
              className={`px-1.5 py-0.5 rounded-md transition-all text-[10px] ${
                !image 
                  ? 'bg-[#2A2F38] text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#059669] to-[#0D9488] text-white'
              }`}
            >
              Save
            </motion.button>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="block sm:hidden mb-2">
          <div className="bg-[#232830] p-1 rounded-md flex">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileView('single')}
              className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 ${
                mobileView === 'single' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-[#1A1D24] text-gray-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5z" />
              </svg>
              <span className="text-xs font-medium">Single</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileView('tiled')}
              className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1.5 ${
                mobileView === 'tiled' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-[#1A1D24] text-gray-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span className="text-xs font-medium">Tiled</span>
            </motion.button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1 min-h-0 overflow-visible">
          {/* Single Pattern Preview */}
          <motion.div 
            ref={singlePreviewRef}
            className={`relative rounded-lg overflow-hidden bg-[#2A2F38] min-h-[250px] h-[min(50vh,400px)] ${
              mobileView === 'tiled' ? 'hidden sm:block' : 'block'
            }`}
            onHoverStart={() => setPreviewHovered(true)}
            onHoverEnd={() => setPreviewHovered(false)}
            onMouseDown={(e) => handleMouseDown(e, true)}
            onMouseMove={(e) => handleMouseMove(e, true)}
            style={{
              cursor: singleZoomLevel > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default'
            }}
            whileHover={{ boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-full max-w-[160px] p-3">
                    {/* Loading Animation */}
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-1 rounded-full border-2 border-t-purple-500 border-transparent"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">Generating</span>
                        <span className="text-gray-400">{Math.round(loadingProgress)}%</span>
                      </div>
                      <div className="h-1 bg-[#3A4149] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : image ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-[#2A2F38]"
                >
                  <img 
                    src={image} 
                    alt="Generated Pattern" 
                    className="w-full h-full object-contain select-none"
                    style={{ 
                      transform: `translate(${singlePanPosition.x}px, ${singlePanPosition.y}px) scale(${singleZoomLevel/100}) rotate(${previewRotation}deg)`,
                      transformOrigin: 'center',
                      imageRendering: 'crisp-edges',
                      transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                      pointerEvents: singleZoomLevel > 100 ? 'auto' : 'none',
                      ...getImageFilters()
                    }}
                    draggable={false}
                  />
                  
                  {/* Zoom Indicator - Always visible when zoomed beyond 100% */}
                  {singleZoomLevel > 100 && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {Math.round(singleZoomLevel)}%
                    </div>
                  )}

                  {/* Zoom Overlay - Only visible briefly when zooming */}
                  <AnimatePresence>
                    {showSingleZoomOverlay && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm"
                      >
                        {Math.round(singleZoomLevel)}%
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Moved and Redesigned Hover Controls */}
                  <AnimatePresence>
                    {previewHovered && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-2 right-2 flex flex-col gap-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.9)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => openPreview(image)}
                          className="p-1.5 bg-blue-500/70 hover:bg-blue-600/70 rounded-md text-[10px] backdrop-blur-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16h16m-16 4h16M4 12h16M4 8h16M4 4h16" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(16, 185, 129, 0.9)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = image;
                            link.download = 'pattern.png';
                            link.click();
                          }}
                          className="p-1.5 bg-green-500/70 hover:bg-green-600/70 rounded-md text-[10px] backdrop-blur-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-[10px]">Click Generate to start</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Tiled Pattern Preview */}
          <motion.div 
            ref={tiledPreviewRef}
            className={`relative rounded-lg overflow-hidden bg-[#2A2F38] min-h-[250px] h-[min(50vh,400px)] ${
              mobileView === 'single' ? 'hidden sm:block' : 'block'
            }`}
            onHoverStart={() => setTiledHovered(true)}
            onHoverEnd={() => setTiledHovered(false)}
            onMouseDown={(e) => handleMouseDown(e, false)}
            onMouseMove={(e) => handleMouseMove(e, false)}
            style={{
              cursor: tiledZoomLevel > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default'
            }}
            whileHover={{ boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
          >
            {image ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {tiledCanvasUrl && (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={tiledCanvasUrl} 
                      alt="Tiled Pattern Preview"
                      className="max-w-full max-h-full object-contain select-none"
                      style={{ 
                        transform: `translate(${tiledPanPosition.x}px, ${tiledPanPosition.y}px) scale(${tiledZoomLevel/100})`,
                        transformOrigin: 'center',
                        imageRendering: 'pixelated',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        willChange: 'transform',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        pointerEvents: tiledZoomLevel > 100 ? 'auto' : 'none',
                        ...getImageFilters()
                      }}
                      draggable={false}
                    />
                  </div>
                )}

                {/* Zoom Indicator - Always visible when zoomed beyond 100% */}
                {tiledZoomLevel > 100 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {Math.round(tiledZoomLevel)}%
                  </div>
                )}

                {/* Zoom Overlay */}
                <AnimatePresence>
                  {showTiledZoomOverlay && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm"
                    >
                      {Math.round(tiledZoomLevel)}%
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Moved and Redesigned Hover Controls */}
                <AnimatePresence>
                  {tiledHovered && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-2 right-2 flex flex-col gap-1"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.9)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openPreview(tiledCanvasUrl)}
                        className="p-1.5 bg-blue-500/70 hover:bg-blue-600/70 rounded-md text-[10px] backdrop-blur-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16h16m-16 4h16M4 12h16M4 8h16M4 4h16" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: 'rgba(16, 185, 129, 0.9)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={downloadTiledImage}
                        className="p-1.5 bg-green-500/70 hover:bg-green-600/70 rounded-md text-[10px] backdrop-blur-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <p className="text-[10px]">Tiling preview will appear here</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Controls */}
        {image && (
          <motion.div 
            className="mt-0.5 bg-[#1E2128] p-0.5 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-wrap items-center gap-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">View:</span>
                <div className="flex bg-[#2A2F38] rounded-md p-0.5">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewLayout('grid')}
                    className={`px-1.5 py-0.5 rounded ${
                      previewLayout === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    Grid
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPreviewLayout('continuous')}
                    className={`px-1.5 py-0.5 rounded ${
                      previewLayout === 'continuous' ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    Flow
                  </motion.button>
                </div>
              </div>
              
              {/* Simplified Tile Controls */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400">Tiles:</span>
                <div className="flex bg-[#2A2F38] rounded-md p-0.5">
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTileRows(1); setTileColumns(1); }}
                    className={`px-1.5 py-0.5 rounded ${
                      tileRows === 1 && tileColumns === 1 ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    1×1
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTileRows(2); setTileColumns(2); }}
                    className={`px-1.5 py-0.5 rounded ${
                      tileRows === 2 && tileColumns === 2 ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    2×2
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTileRows(3); setTileColumns(3); }}
                    className={`px-1.5 py-0.5 rounded ${
                      tileRows === 3 && tileColumns === 3 ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    3×3
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCustomTileConfig}
                    className={`px-1.5 py-0.5 rounded ${
                      showCustomTileForm ? 'bg-blue-500 text-white' : 'text-gray-300'
                    }`}
                  >
                    Custom
                  </motion.button>
                </div>
              </div>
              
              {/* Current Tile Layout Display */}
              {(tileRows !== 1 || tileColumns !== 1) && 
               (tileRows !== 2 || tileColumns !== 2) && 
               (tileRows !== 3 || tileColumns !== 3) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Current:</span>
                  <div className="bg-[#2A2F38] rounded-md px-1.5 py-0.5 text-white">
                    {tileColumns}×{tileRows}
                  </div>
                </div>
              )}
              
              <motion.button
                whileHover={{ backgroundColor: showTileLines ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTileLines(!showTileLines)}
                className={`px-1.5 py-0.5 rounded ${
                  showTileLines ? 'bg-blue-500 text-white' : 'bg-[#2A2F38] text-gray-300'
                }`}
              >
                {showTileLines ? 'Hide Grid' : 'Show Grid'}
              </motion.button>
              
              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewRotation((prev) => (prev + 90) % 360)}
                className="px-1.5 py-0.5 rounded bg-[#2A2F38] text-gray-300"
              >
                Rotate
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowControls(!showControls)}
                className="px-1.5 py-0.5 rounded bg-[#2A2F38] text-gray-300 ml-auto"
              >
                {showControls ? 'Hide Controls' : 'Image Controls'}
              </motion.button>
            </div>

            {/* Custom Tile Form */}
            <AnimatePresence>
              {showCustomTileForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 bg-[#2A2F38] p-1.5 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Rows:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={customRowsInput}
                        onChange={(e) => setCustomRowsInput(e.target.value)}
                        className="w-12 px-1.5 py-0.5 bg-[#1E2128] border border-[#3A4149] rounded text-[10px] text-white"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Columns:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={customColumnsInput}
                        onChange={(e) => setCustomColumnsInput(e.target.value)}
                        className="w-12 px-1.5 py-0.5 bg-[#1E2128] border border-[#3A4149] rounded text-[10px] text-white"
                      />
                    </div>
                    <div className="flex gap-1 ml-auto">
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCustomTileForm(false)}
                        className="px-1.5 py-0.5 rounded bg-[#1E2128] text-gray-300 text-[10px]"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={applyCustomTileConfig}
                        className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[10px]"
                      >
                        Apply
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Adjustment Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-1 space-y-1"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 w-16">Brightness</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="flex-1 h-1 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 w-8">{brightness}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 w-16">Contrast</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="flex-1 h-1 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 w-8">{contrast}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 w-16">Saturation</span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(e.target.value)}
                      className="flex-1 h-1 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-gray-400 w-8">{saturation}%</span>
                  </div>
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={resetImageAdjustments}
                      className="px-1.5 py-0.5 rounded bg-[#2A2F38] text-gray-300 text-[10px]"
                    >
                      Reset
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Mobile Image Controls - Always Visible on Small Screens */}
      <div className="block sm:hidden mt-2 p-2 bg-[#232830] rounded-lg">
        <div className="mb-2">
          <h4 className="text-xs font-semibold text-white mb-1">Image Adjustments</h4>
          <div className="text-xs text-gray-400">Adjust image properties with the sliders below.</div>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Brightness</span>
              <span className="text-xs text-gray-400">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(e.target.value)}
              className="w-full h-1.5 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Contrast</span>
              <span className="text-xs text-gray-400">{contrast}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(e.target.value)}
              className="w-full h-1.5 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Saturation</span>
              <span className="text-xs text-gray-400">{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(e.target.value)}
              className="w-full h-1.5 bg-[#2A2F38] rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          {mobileView === 'tiled' && (
            <div className="pt-2 border-t border-[#3A4149]/30">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-white">Tile Controls</h4>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTileLines(!showTileLines)}
                  className={`px-2 py-1 text-xs rounded ${
                    showTileLines ? 'bg-blue-500 text-white' : 'bg-[#2A2F38] text-gray-300'
                  }`}
                >
                  {showTileLines ? 'Hide Grid' : 'Show Grid'}
                </motion.button>
              </div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTileRows(1); setTileColumns(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    tileRows === 1 && tileColumns === 1 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-[#2A2F38] text-gray-300'
                  }`}
                >
                  1×1
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTileRows(2); setTileColumns(2); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    tileRows === 2 && tileColumns === 2 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-[#2A2F38] text-gray-300'
                  }`}
                >
                  2×2
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setTileRows(3); setTileColumns(3); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                    tileRows === 3 && tileColumns === 3 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-[#2A2F38] text-gray-300'
                  }`}
                >
                  3×3
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPreviewRotation((prev) => (prev + 90) % 360)}
                className="w-full py-1.5 rounded-md bg-[#2A2F38] text-gray-300 text-xs font-medium mb-2"
              >
                Rotate Pattern
              </motion.button>
            </div>
          )}
          
          <div className="flex justify-end">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={resetImageAdjustments}
              className="px-3 py-1 rounded bg-[#3A4149] text-gray-300 text-xs"
            >
              Reset
            </motion.button>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              className="relative w-full h-full flex items-center justify-center"
              onMouseDown={handleFullscreenMouseDown}
              onMouseMove={handleFullscreenMouseMove}
              onMouseUp={() => setIsPanning(false)}
              style={{
                cursor: fullscreenZoom > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <img
                src={fullscreenImage}
                alt="Fullscreen Preview"
                className="max-w-[90%] max-h-[90%] object-contain select-none"
                style={{
                  transform: `translate(${fullscreenPan.x}px, ${fullscreenPan.y}px) scale(${fullscreenZoom/100})`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  ...getImageFilters()
                }}
                draggable={false}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Fullscreen Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="bg-black/40 text-white text-sm px-3 py-1 rounded-md backdrop-blur-sm">
                  {Math.round(fullscreenZoom)}%
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenZoom(prev => Math.max(50, prev - 50));
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenZoom(prev => prev + 50);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenZoom(100);
                    setFullscreenPan({ x: 0, y: 0 });
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l-4 4m0 0l-4-4m4 4V3m0 11v3" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreen(false);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-md backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Tile Configuration Controls */}
              <div className="absolute top-4 left-4 bg-black/40 text-white rounded-md backdrop-blur-sm flex flex-col gap-2 p-2">
                <div className="text-sm font-medium text-center">Tile Layout: {tileColumns}×{tileRows}</div>
                
                <div className="flex gap-2 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTileRows(1); setTileColumns(1);
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      tileRows === 1 && tileColumns === 1 
                        ? 'bg-blue-500/70' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    1×1
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTileRows(2); setTileColumns(2);
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      tileRows === 2 && tileColumns === 2 
                        ? 'bg-blue-500/70' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    2×2
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTileRows(3); setTileColumns(3);
                    }}
                    className={`px-2 py-1 rounded text-xs ${
                      tileRows === 3 && tileColumns === 3 
                        ? 'bg-blue-500/70' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    3×3
                  </motion.button>
                </div>
                
                {/* Fullscreen Custom Tile Input */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300">Rows:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customRowsInput || tileRows}
                      onChange={(e) => setCustomRowsInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 px-1.5 py-0.5 bg-black/30 border border-white/20 rounded text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-300">Cols:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customColumnsInput || tileColumns}
                      onChange={(e) => setCustomColumnsInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-12 px-1.5 py-0.5 bg-black/30 border border-white/20 rounded text-xs text-white"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      applyCustomTileConfig();
                    }}
                    className="px-2 py-1 bg-blue-500/50 hover:bg-blue-500/70 rounded text-xs"
                  >
                    Apply
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatternPreview; 