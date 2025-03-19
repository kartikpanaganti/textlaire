import { useState, useEffect, useRef } from 'react';
import { configureClient, connectRealtime } from '../api/falClient';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

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

function randomSeed() {
  return Math.floor(Math.random() * 10000000).toFixed(0);
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

  // Configure API URL based on hostname or env var
  const API_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:5000' : 
      `http://${window.location.hostname}:5000`);

  useEffect(() => {
    // Configure the fal client
    configureClient();

    // Connect to the fal.ai realtime API
    const initConnection = async () => {
      try {
        setIsLoading(true);
        const conn = await connectRealtime('fal-ai/fast-lightning-sdxl', {
          connectionKey: 'lightning-sdxl',
          throttleInterval: 64,
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

    initConnection();

    // Load saved images from server API
    const loadSavedImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/patterns`);
        if (response.data && Array.isArray(response.data)) {
          setSavedImages(response.data);
          console.log(`Loaded ${response.data.length} patterns from server`);
        }
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
    
    // Create form data to send file
    const formData = new FormData();
    
    // Add product metadata
    formData.append('id', uuidv4());
    formData.append('name', productName);
    formData.append('code', productCode);
    formData.append('type', towelType);
    formData.append('material', towelMaterial);
    formData.append('color', towelColor);
    formData.append('dimensions', dimensions);
    formData.append('price', price);
    formData.append('prompt', prompt);
    formData.append('seed', seed);
    
    // Convert blob to file and append to form
    const file = new File([imageBlob], `pattern-${Date.now()}.jpg`, { type: 'image/jpeg' });
    formData.append('image', file);
    
    // Save to server
    axios.post(`${API_URL}/api/patterns`, formData)
      .then(response => {
        // Update local state with server response
        const newProduct = response.data.product;
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
        showNotification(`Error saving product: ${error.response?.data?.error || 'Unknown error'}`);
      });
  };

  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`${API_URL}/api/patterns/${productId}`);
      
      // Update local state
      const updatedProducts = savedImages.filter(product => product.id !== productId);
      setSavedImages(updatedProducts);
      
      showNotification("Product deleted successfully");
    } catch (error) {
      console.error('Error deleting product:', error);
      showNotification(`Error deleting product: ${error.response?.data?.error || 'Unknown error'}`);
    }
  };

  // Render content based on saved images with URLs
  const renderImage = (product) => {
    // Check if product has imageUrl (server-based) or imageData (base64)
    if (product.imageUrl) {
      return `${API_URL}${product.imageUrl}`;
    } else if (product.imageData) {
      return product.imageData;
    }
    return '';
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
    openPreview
  };

  const galleryProps = {
    savedImages,
    deleteProduct,
    openPreview,
    renderImage
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#0A0C10] text-gray-100 min-h-screen overflow-hidden"
    >
      {/* Compact Header */}
      <motion.header 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="sticky top-0 left-0 right-0 z-50 px-2 py-1.5 bg-[#0A0C10]"
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="bg-[#1A1D24]/90 backdrop-blur-xl rounded-lg px-3 py-1.5 flex justify-between items-center border border-[#2A2F38] shadow-xl">
            <motion.h1 
              className="text-base font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#60A5FA] via-[#A78BFA] to-[#F472B6]">
                AI Pattern Designer
              </span>
            </motion.h1>
            <div className="flex space-x-1.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('generate')}
                className={`px-3 py-1 rounded-md transition-all text-xs ${
                  activeTab === 'generate' 
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white' 
                    : 'bg-[#1E2128] text-gray-300 hover:bg-[#2A2F38]'
                }`}
              >
                Design
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded-md transition-all text-xs ${
                  activeTab === 'saved' 
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white' 
                    : 'bg-[#1E2128] text-gray-300 hover:bg-[#2A2F38]'
                }`}
              >
                Gallery
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content with Proper Scrolling */}
      <div className="px-2 pb-2 pt-2 h-[calc(100vh-3rem)] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1200px] mx-auto h-full"
            >
              <div className="grid grid-cols-12 gap-2 h-full">
                {/* Design Controls - Left Panel */}
                <motion.div
                  className="col-span-3 h-full overflow-y-auto pr-1"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <DesignControls {...designControlsProps} />
                </motion.div>

                {/* Main Preview Area - Center */}
                <motion.div
                  className="col-span-6 h-full overflow-y-auto pr-1"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <PatternPreview {...patternPreviewProps} />
                </motion.div>

                {/* Product Details - Right Panel */}
                <motion.div
                  className="col-span-3 h-full overflow-y-auto pr-1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <ProductDetails {...productDetailsProps} />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-[1200px] mx-auto h-full overflow-y-auto"
            >
              <GalleryGrid {...galleryProps} />
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