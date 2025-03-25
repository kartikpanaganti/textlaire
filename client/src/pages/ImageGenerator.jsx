import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import * as fal from '@fal-ai/serverless-client';
import { randomSeed } from '../components/image-gen/utils';

// Import API client
import { 
  configureFalClient, 
  getWebSocketDetails,
  getAllPatterns,
  savePattern as savePatternToServer,
  deletePattern as deletePatternFromServer
} from '../lib/api';

// Import components
import DesignControls from '../components/image-gen/DesignControls';
import ProductDetails from '../components/image-gen/ProductDetails';
import PatternPreview from '../components/image-gen/PatternPreview';
import GalleryGrid from '../components/image-gen/GalleryGrid';
import PreviewModal from '../components/image-gen/PreviewModal';
import ToastNotification from '../components/image-gen/ToastNotification';

// Import constants
import { 
  DEFAULT_PROMPT, 
  DESIGN_PATTERNS, 
  DESIGN_STYLES,
  DESIGN_ELEMENTS,
  PERSONALIZATION_OPTIONS,
  TEXT_PLACEMENT_OPTIONS,
  SAMPLE_PATTERNS,
  SEAMLESS_PATTERN_TYPES,
  TOWEL_TYPES,
  TOWEL_MATERIALS,
  TOWEL_COLORS,
  TOWEL_APPLICATIONS,
  TEXTILE_FINISHES,
  INPUT_DEFAULTS
} from '../components/image-gen/constants';

// Add a custom hook for viewport detection
function useViewportSize() {
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewportSize;
}

function ImageGenerator() {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [seed, setSeed] = useState(randomSeed());
  const [inferenceTime, setInferenceTime] = useState(NaN);
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageBlob, setImageBlob] = useState(null);
  const [savedImages, setSavedImages] = useState([]);
  
  // Towel product metadata
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [towelType, setTowelType] = useState(TOWEL_TYPES[0]);
  const [towelMaterial, setTowelMaterial] = useState(TOWEL_MATERIALS[0]);
  const [towelColor, setTowelColor] = useState(TOWEL_COLORS[0].id);
  const [dimensions, setDimensions] = useState("");
  const [price, setPrice] = useState("");
  
  const timer = useRef(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [designPattern, setDesignPattern] = useState(DESIGN_PATTERNS[0].id);
  const [designStyle, setDesignStyle] = useState(DESIGN_STYLES[0].id);
  const [designElement, setDesignElement] = useState(DESIGN_ELEMENTS[0]);

  const [previewImage, setPreviewImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Add new state for personalization
  const [personalization, setPersonalization] = useState("None");
  const [personalizationText, setPersonalizationText] = useState("");
  const [textPlacement, setTextPlacement] = useState("Corner");
  const [isCustomizing, setIsCustomizing] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(0);
  const loadingInterval = useRef(null);

  const [customColor, setCustomColor] = useState("");
  const [selectedPattern, setSelectedPattern] = useState(SAMPLE_PATTERNS[0]);

  const [customPrompt, setCustomPrompt] = useState("");
  const [application, setApplication] = useState(TOWEL_APPLICATIONS[0]);
  const [textileFinish, setTextileFinish] = useState(TEXTILE_FINISHES[0]);
  const [patternScale, setPatternScale] = useState("medium");
  const [patternDensity, setPatternDensity] = useState("balanced");
  const [advancedPromptMode, setAdvancedPromptMode] = useState(false);

  const [seamlessType, setSeamlessType] = useState(SEAMLESS_PATTERN_TYPES[0].id);
  const [tilePreview, setTilePreview] = useState(true);
  const [tileCount, setTileCount] = useState(4); // 2x2 grid

  const [previewZoom, setPreviewZoom] = useState(100);
  const [showTileLines, setShowTileLines] = useState(false);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [previewLayout, setPreviewLayout] = useState('grid'); // 'grid' or 'continuous'

  // Add image adjustment states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Configure API URL based on hostname or env var
  const API_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:5000' : 
      `//${window.location.host}`);

  // Add viewport size hook
  const viewport = useViewportSize();
  
  // Add state for mobile panel navigation
  const [activeMobilePanel, setActiveMobilePanel] = useState('preview');

  useEffect(() => {
    // Update prompt when pattern selection changes
    updatePromptFromMetadata();
  }, [selectedPattern, seamlessType, designStyle, customColor, application, textileFinish, 
      patternScale, patternDensity, personalization, personalizationText, textPlacement, customPrompt]);

  useEffect(() => {
    // Configure the fal client and setup connection
    const initializeClient = async () => {
      try {
        setIsLoading(true);
        
        // Configure the client using our API
        await configureFalClient();
        
        // Get WebSocket details from the server
        const { wsUrl, apiKey } = await getWebSocketDetails();
        
        // Setup fal client with the obtained configuration
        fal.config({
          proxyUrl: `${API_URL}/api/proxy`,
          requestOptionsTransformer: (options) => ({
            ...options,
            headers: {
              ...options.headers,
              'x-fal-target-url': options.url,
            },
          }),
        });
        
        // Connect to realtime API
        const conn = await fal.realtime.connect('fal-ai/fast-lightning-sdxl', {
          connectionKey: 'lightning-sdxl',
          throttleInterval: 64,
          credentials: {
            baseUrl: wsUrl,
            key: apiKey,
          },
          onResult: (result) => {
            const blob = new Blob([result.images[0].content], { type: 'image/jpeg' });
            setImageBlob(blob);
            setImage(URL.createObjectURL(blob));
            setInferenceTime(result.timings.inference);
            setIsLoading(false);
          },
        });
        
        setConnection(conn);
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing connection:', error);
        setIsLoading(false);
      }
    };

    initializeClient();

    // Load saved images from server API
    const loadSavedImages = async () => {
      try {
        const products = await getAllPatterns();
        setSavedImages(products);
        console.log(`Loaded ${products.length} patterns from server`);
      } catch (error) {
        console.error('Error loading patterns from server:', error);
        showNotification("Could not load patterns from server");
      }
    };
    
    loadSavedImages();

    // Cleanup function
    return () => {
      if (connection) {
        connection.close();
      }
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const generateImageWithParams = (enhancedPrompt, currentSeed) => {
    if (!connection) {
      console.error('No connection available');
      return;
    }
    
    setIsLoading(true);
    setLoadingProgress(0);
    
    // Start the loading interval
    if (loadingInterval.current) {
      clearInterval(loadingInterval.current);
    }
    
    loadingInterval.current = setInterval(() => {
      setLoadingProgress(prev => {
        const increment = Math.random() * 3;
        return Math.min(prev + increment, 95); // Cap at 95% until complete
      });
    }, 200);
    
    // Process the prompt
    if (!advancedPromptMode) {
      // Build the enhanced prompt from all the selected options
      // ... existing code ...
    } else {
      // In advanced mode, use the custom prompt directly
      // Only add minimal seamless pattern enforcement if not already present
      if (!enhancedPrompt.toLowerCase().includes('seamless') && !enhancedPrompt.toLowerCase().includes('tileable')) {
        enhancedPrompt += ", seamless tileable pattern";
      }
    }
    
    const input = {
      ...INPUT_DEFAULTS,
      prompt: enhancedPrompt,
      negative_prompt: "background, borders, edges, product shape, towel shape, 3D, folded, hanging, draped, background objects, human, hands, watermark, text, incomplete patterns, misaligned elements, visible seams, pattern breaks, asymmetry, edge artifacts, discontinuities",
      seed: currentSeed ? Number(currentSeed) : Number(randomSeed()),
      request_id: uuidv4()
    };
    
    connection.send(input);
  };

  const generateImage = () => {
    // Ensure prompt is updated with latest pattern selection before generating
    updatePromptFromMetadata();
    generateImageWithParams(prompt, seed);
  };

  const updatePromptFromMetadata = () => {
    if (advancedPromptMode) {
      // In advanced mode, use the custom prompt directly
      setPrompt(customPrompt || DEFAULT_PROMPT);
      return;
    }

    // Base prompt construction with enhanced textile-specific details
    let basePrompt = `Ultra high-resolution ${towelMaterial} textile pattern design for ${application.toLowerCase()} ${towelType.toLowerCase()}, `;
    
    // Get selected pattern and style details
    const selectedStyle = DESIGN_STYLES.find(s => s.id === designStyle);
    
    // Add color emphasis with custom color
    if (customColor) {
      basePrompt += `with ${customColor} as the dominant color scheme, creating rich and vibrant tones throughout the design, `;
    }
    
    // Add sample pattern details
    if (selectedPattern.id === "custom" && customPrompt) {
      basePrompt += `featuring ${customPrompt}, `;
    } else {
      basePrompt += `featuring ${selectedPattern.prompt}, `;
    }
    
    // Style-specific details
    basePrompt += `rendered with ${selectedStyle.technique}, `;
    
    // Add pattern scale and density
    basePrompt += `with ${patternScale} scale and ${patternDensity} pattern density, `;
    
    // Add textile finish
    basePrompt += `designed for ${textileFinish.toLowerCase()} finish, `;
    
    // Get selected seamless type
    const selectedSeamlessType = SEAMLESS_PATTERN_TYPES.find(t => t.id === seamlessType);
    
    // Add seamless pattern specifications
    basePrompt += `created as a ${selectedSeamlessType.name.toLowerCase()} seamless pattern that tiles perfectly in both horizontal and vertical directions, `;
    basePrompt += "with mathematically precise edges ensuring no visible seams when repeated. ";
    
    // Technical specifications for seamless pattern
    basePrompt += "Perfect for continuous textile printing with balanced composition and continuous flow across tiles. ";
    
    // Add personalization if selected
    if (personalization !== "None" && personalizationText) {
      basePrompt += `Incorporating ${personalization.toLowerCase()} "${personalizationText}" `;
      basePrompt += `elegantly placed in the ${textPlacement.toLowerCase()}, `;
      basePrompt += "harmoniously integrated into the overall design. ";
    }
    
    // Quality specifications
    basePrompt += "Professional textile quality with perfect color balance and industry-standard production compatibility. ";
    
    // Copyright-free assurance
    basePrompt += "Original design without copyrighted elements. ";
    
    setPrompt(basePrompt);
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveImage = () => {
    if (!imageBlob || !productName) {
      showNotification("Please provide a product name before saving");
      return;
    }
    
    // Apply filters to the image if any are modified from defaults
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      const applyFiltersAndSave = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to apply filters
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          // Apply CSS filters to canvas
          ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
          
          // Draw the image with filters applied
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          // Convert canvas to blob
          canvas.toBlob((filteredBlob) => {
            // Now save with the filtered blob
            saveImageWithBlob(filteredBlob);
          }, 'image/jpeg', 1.0);
        };
        
        img.src = URL.createObjectURL(imageBlob);
      };
      
      applyFiltersAndSave();
    } else {
      // No filters to apply, save the original image
      saveImageWithBlob(imageBlob);
    }
  };
  
  // Helper function to save image with given blob
  const saveImageWithBlob = (blob) => {
    // Prepare the product data with all details
    const productData = {
      id: uuidv4(),
      name: productName,
      code: productCode || `PRD-${Date.now().toString().slice(-6)}`,
      type: towelType,
      material: towelMaterial,
      color: towelColor,
      dimensions: dimensions || '50cm x 100cm',
      price: price || '$29.99',
      application: application,
      finish: textileFinish,
      prompt: prompt,
      seed: seed,
      createdAt: new Date().toISOString(),
      pattern: selectedPattern?.name || 'Custom Pattern',
      style: designStyle,
      scale: patternScale,
      density: patternDensity,
      // Store filter values for future reference
      filters: {
        brightness,
        contrast,
        saturation
      }
    };
    
    // Convert blob to file
    const file = new File([blob], `pattern-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Save pattern using API
    savePatternToServer(productData, file)
      .then(response => {
        // Update local state with server response
        const newProduct = response.product;
        const updatedProducts = [...savedImages, newProduct];
        setSavedImages(updatedProducts);
        
        showNotification("Product saved successfully!");
        
        // Clear form fields after saving
        setProductName("");
        setProductCode("");
        setDimensions("");
        setPrice("");
      })
      .catch(error => {
        console.error('Error saving product:', error);
        showNotification(`Error saving product: ${error.message || 'Unknown error'}`);
      });
  };

  const deleteProduct = async (productId) => {
    try {
      await deletePatternFromServer(productId);
      
      // Update local state
      const updatedProducts = savedImages.filter(product => product.id !== productId);
      setSavedImages(updatedProducts);
      
      showNotification("Product deleted successfully");
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification(`Error deleting product: ${error.message || 'Unknown error'}`);
    }
  };

  const updateProduct = async (updatedProduct) => {
    try {
      // You would typically make an API call to update the product
      // This is a placeholder for that functionality
      console.log("Updating product:", updatedProduct);
      
      // For now we'll just update our local state
      const updatedProducts = savedImages.map(product => 
        product.id === updatedProduct.id ? updatedProduct : product
      );
      
      setSavedImages(updatedProducts);
      showNotification("Product updated successfully");
      
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      showNotification(`Error updating product: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  // Render content based on saved images with URLs
  const renderImage = (product) => {
    // Check if product has imageUrl (server-based) or imageData (base64)
    if (product.imageUrl) {
      return product.imageUrl.startsWith('http') 
        ? product.imageUrl 
        : `${API_URL}${product.imageUrl}`;
    } else if (product.imageData) {
      return product.imageData;
    } else if (product.image) {
      // Already has the full image URL (from memory)
      return product.image;
    }
    
    // Fallback to placeholder image if none available
    return 'https://via.placeholder.com/300?text=No+Image';
  };

  const openPreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setShowPreview(true);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setShowPreview(false);
  };

  useEffect(() => {
    if (connection) {
      connection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status === 'COMPLETED') {
          // Complete the loading progress
          setLoadingProgress(100);
          if (loadingInterval.current) {
            clearInterval(loadingInterval.current);
            loadingInterval.current = null;
          }
          
          const blob = new Blob([data.output[0].content], { type: 'image/jpeg' });
          setImageBlob(blob);
          setImage(URL.createObjectURL(blob));
          setInferenceTime(data.inference_time);
          setIsLoading(false);
        }
      };
    }
    
    return () => {
      if (loadingInterval.current) {
        clearInterval(loadingInterval.current);
      }
    };
  }, [connection]);

  // Function to handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Force re-render on window resize to update container sizes
      setPreviewZoom(previewZoom => previewZoom);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Collect all the state and handlers to pass to components
  const designControlsProps = {
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
  };

  const productDetailsProps = {
    productName,
    setProductName,
    productCode,
    setProductCode,
    dimensions,
    setDimensions,
    price,
    setPrice
  };

  const patternPreviewProps = {
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
    // Add filter controls
    brightness,
    setBrightness,
    contrast,
    setContrast,
    saturation,
    setSaturation
  };

  const galleryProps = {
    savedImages,
    deleteProduct,
    openPreview,
    renderImage,
    updateProduct
  };

  return (
    <motion.div 
      className="relative h-full flex flex-col bg-[#0F1115]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Modern Header with Glass Effect */}
      <motion.header 
        className="sticky top-0 z-10 bg-[#0F1115]/80 backdrop-blur-md border-b border-[#2A2F38] shadow-md"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-[1200px] mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              className="w-8 h-8 mr-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
            </motion.div>
            <h1 className="text-lg font-semibold text-white">Pattern Generator</h1>
          </div>

          <div className="flex gap-2">
            {/* Tab Switching - Modern Pill Style */}
            <div className="bg-[#1A1D24] p-1 rounded-full shadow-inner flex">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('generate')}
                className={`px-4 py-1.5 rounded-full transition-all text-xs font-medium ${
                  activeTab === 'generate' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Design Studio
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-1.5 rounded-full transition-all text-xs font-medium ${
                  activeTab === 'saved' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-transparent text-gray-400 hover:text-white'
                }`}
              >
                Pattern Gallery
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content with Responsive Layout */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full mx-auto max-w-[1400px] p-2"
            >
              {viewport.isMobile ? (
                // Mobile Layout - Swipeable Panels
                <div className="h-full flex flex-col">
                  {/* Mobile Panel Navigation */}
                  <div className="bg-[#1A1D24] p-1.5 rounded-lg mb-2 flex justify-between items-center shadow-md">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setActiveMobilePanel('preview')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeMobilePanel === 'preview' 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-[#232830] text-gray-400'
                        }`}
                      >
                       IMG Preview
                      </button>
                      <button
                        onClick={() => setActiveMobilePanel('controls')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeMobilePanel === 'controls' 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-[#232830] text-gray-400'
                        }`}
                      >
                        Design Controls
                      </button>
                      <button
                        onClick={() => setActiveMobilePanel('details')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          activeMobilePanel === 'details' 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'bg-[#232830] text-gray-400'
                        }`}
                      >
                        Product Details
                      </button>
                    </div>
                    {activeMobilePanel === 'preview' && !isLoading && image && (
                      <div className="flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={generateImage}
                          className="p-1.5 rounded-md bg-blue-600 text-white text-xs shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={saveImage}
                          className="p-1.5 rounded-md bg-green-600 text-white text-xs shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                        </motion.button>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile Panels Content */}
                  <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">
                      {activeMobilePanel === 'preview' && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="h-full overflow-y-auto pb-24"
                        >
                          <PatternPreview {...patternPreviewProps} />
                        </motion.div>
                      )}
                      
                      {activeMobilePanel === 'controls' && (
                        <motion.div
                          key="controls"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="h-full overflow-y-auto"
                        >
                          <DesignControls {...designControlsProps} />
                        </motion.div>
                      )}
                      
                      {activeMobilePanel === 'details' && (
                        <motion.div
                          key="details"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="h-full overflow-y-auto"
                        >
                          <ProductDetails {...productDetailsProps} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : viewport.isTablet ? (
                // Tablet Layout - Two Column
                <div className="h-full grid grid-cols-5 gap-3">
                  <div className="col-span-2 grid grid-rows-2 gap-3 h-full">
                    <div className="overflow-y-auto bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50">
                      <DesignControls {...designControlsProps} />
                    </div>
                    <div className="overflow-y-auto bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50">
                      <ProductDetails {...productDetailsProps} />
                    </div>
                  </div>
                  <div className="col-span-3 h-full bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50 overflow-hidden">
                    <PatternPreview {...patternPreviewProps} />
                  </div>
                </div>
              ) : (
                // Desktop Layout - Three Column
                <div className="h-full grid grid-cols-12 gap-3">
                  <div className="col-span-3 h-full bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50 overflow-y-auto">
                    <DesignControls {...designControlsProps} />
                  </div>
                  <div className="col-span-6 h-full bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50 overflow-hidden">
                    <PatternPreview {...patternPreviewProps} />
                  </div>
                  <div className="col-span-3 h-full bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50 overflow-y-auto">
                    <ProductDetails {...productDetailsProps} />
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[1400px] mx-auto h-full overflow-y-auto p-2"
            >
              <div className="bg-[#1A1D24] rounded-xl p-4 shadow-lg border border-[#2A2F38]/50 h-full">
                <GalleryGrid {...galleryProps} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal Component */}
      <PreviewModal 
        showPreview={showPreview}
        previewImage={previewImage}
        closePreview={closePreview}
        setTileCount={setTileCount}
        setPreviewRotation={setPreviewRotation}
      />

      {/* Toast Notification Component */}
      <ToastNotification 
        showToast={showToast}
        toastMessage={toastMessage}
      />
    </motion.div>
  );
}

export default ImageGenerator; 