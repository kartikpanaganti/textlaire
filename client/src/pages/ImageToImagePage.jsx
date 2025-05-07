import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fileToBase64, isImageFile } from '../components/image-gen/utils';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductDetails from '../components/image-gen/ProductDetails';

const ImageToImagePage = () => {
  // Initialize state without using localStorage for images to avoid blob storage issues
  const [sourceImage, setSourceImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [imageMetadata, setImageMetadata] = useState(null); // Store metadata for saving later
  const [prompt, setPrompt] = useState(() => {
    const saved = localStorage.getItem('textlaire_prompt');
    return saved ? saved : '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state for saving process
  const [strength, setStrength] = useState(0.65);
  const [steps, setSteps] = useState(40);
  const [guidance, setGuidance] = useState(12);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false); // Track if image was saved
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
  
  // Product details state
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [price, setPrice] = useState('');
  const [showProductDetails, setShowProductDetails] = useState(false);

  // Handle product details toggle
  const toggleProductDetails = () => {
    setShowProductDetails(!showProductDetails);
  };

  // Save the generated image to the server
  const saveGeneratedImage = async () => {
    if (!resultImage || !imageMetadata) {
      setError('No image to save');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      // Generate a unique product code if not provided
      const generatedCode = productCode || `PATTERN-${Date.now().toString().substring(6)}`;
      
      // Create product data from the form
      const productData = {
        name: productName || `Generated Pattern ${new Date().toLocaleDateString()}`,
        code: generatedCode,
        type: 'pattern',
        material: 'cotton',
        color: '',
        dimensions: dimensions || '100x100 cm',
        price: price || '500',
        currency: 'INR',
        qualityGrade: 'premium',
        weight: '400',
        description: prompt || 'AI-generated pattern',
        tags: 'ai-generated, pattern',
        createdAt: new Date().toISOString()
      };
      
      console.log('Saving product with data:', productData);
      
      // Send request to save the image
      const response = await axios.post('/api/fal/save-generated-image', {
        imageUrl: resultImage,
        metadata: imageMetadata,
        productData: productData
      });
      
      if (response.data.success) {
        // Update the image URL to the local path
        setResultImage(response.data.localImagePath);
        setSaveSuccess(true);
        // toast.success('Pattern saved successfully');
      } else {
        throw new Error('Failed to save pattern');
      }
    } catch (error) {
      console.error('Error saving pattern:', error);
      setError('Failed to save pattern: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Update container height on window resize
  useEffect(() => {
    const handleResize = () => {
      setContainerHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Only save prompt to localStorage, not images
  useEffect(() => {
    if (prompt) {
      localStorage.setItem('textlaire_prompt', prompt);
    }
  }, [prompt]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setError('Please select a valid image file (jpg, jpeg, png, webp)');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      // Store the complete base64 data with the prefix
      setSourceImage(base64);
      setPreviewUrl(base64); // Use the base64 data directly for preview
      
      // Save to localStorage after successful upload
      localStorage.setItem('textlaire_sourceImage', base64);
      localStorage.setItem('textlaire_previewUrl', base64);
      
      setError('');
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Failed to read image file');
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!isImageFile(file)) {
      setError('Please select a valid image file (jpg, jpeg, png, webp)');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      // Store the complete base64 data with the prefix
      setSourceImage(base64);
      setPreviewUrl(base64); // Use the base64 data directly for preview
      
      // Save to localStorage after successful upload
      localStorage.setItem('textlaire_sourceImage', base64);
      localStorage.setItem('textlaire_previewUrl', base64);
      
      setError('');
    } catch (error) {
      console.error('Error reading file:', error);
      setError('Failed to read image file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const generateImage = async () => {
    if (!sourceImage || !prompt) {
      setError('Please provide both an image and a prompt');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Make sure we have valid image data
      if (!sourceImage) {
        setError('No source image available. Please upload an image first.');
        return;
      }
      
      // Log the image data format for debugging
      console.log('Image data format check:', {
        isString: typeof sourceImage === 'string',
        startsWithData: sourceImage.startsWith('data:image/'),
        length: sourceImage.length
      });
      
      // Ensure the image data is properly formatted
      const imageData = sourceImage.startsWith('data:image/') 
        ? sourceImage 
        : `data:image/jpeg;base64,${sourceImage}`;
      
      // Compress the image if it's too large (over 1MB)
      let processedImageData = imageData;
      if (imageData.length > 1000000) {
        try {
          // Create an image element to load the data URL
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageData;
          });
          
          // Create a canvas to resize and compress the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 800px width/height while maintaining aspect ratio)
          const maxSize = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);
          processedImageData = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
          
          console.log('Compressed image size:', processedImageData.length);
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError);
          // Fall back to original image data
        }
      }
        
      const response = await axios.post('/api/fal/image-to-image', {
        imageData: processedImageData,
        prompt,
        strength: parseFloat(strength),
        num_inference_steps: parseInt(steps),
        guidance_scale: parseFloat(guidance),
        seed: -1
      }, {
        // Add timeout to prevent long-running requests
        timeout: 120000 // 120 seconds
      });

      if (response.data.imageUrl) {
        // Store the remote image URL for display
        setResultImage(response.data.imageUrl);
        
        // Store the metadata for later saving
        setImageMetadata(response.data.metadata);
        
        // Reset save status
        setSaveSuccess(false);
        
        console.log('Generated image URL:', response.data.imageUrl);
        console.log('Image metadata stored for later saving:', response.data.metadata);
        
        // Keep source image for further adjustments
        
        // Only save prompt to localStorage
        localStorage.setItem('textlaire_prompt', prompt);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      // Extract the most helpful error message
      let errorMessage = 'Failed to generate image';
      
      if (error.response?.data) {
        // Handle structured error response
        errorMessage = error.response.data.details || error.response.data.error || error.message;
        
        // Don't display object errors to the user
        if (typeof errorMessage === 'object') {
          console.error('Received object error:', errorMessage);
          errorMessage = 'Server error occurred. Please try again.';
        }
        
        if (error.response.data.validationErrors) {
          console.error('Validation errors:', error.response.data.validationErrors);
        }
      } else {
        // Handle network or other errors
        errorMessage = error.message || 'Network error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!resultImage || !productName) {
      setError('Please provide a product name before saving');
      return;
    }

    try {
      // Get reference to the ProductDetails component
      const productDetailsRef = document.getElementById('product-details');
      if (!productDetailsRef) {
        console.error('Product details component not found');
        setError('Error saving product: Unable to access form data');
        return;
      }
      
      // Use data attributes to get form field values more reliably
      const getFieldValue = (fieldName) => {
        const element = productDetailsRef.querySelector(`[data-field="${fieldName}"]`);
        return element ? element.value : null;
      };
      
      // Get all form values using data attributes without default fallbacks
      const type = getFieldValue('type');
      const material = getFieldValue('material');
      const color = getFieldValue('color');
      const width = getFieldValue('width');
      const height = getFieldValue('height');
      const unit = getFieldValue('unit');
      const qualityGrade = getFieldValue('qualityGrade');
      const weight = getFieldValue('weight');
      const description = getFieldValue('description');
      
      // For tags, we need to extract from the DOM
      const tagElements = productDetailsRef.querySelectorAll('[data-tag]');
      const tags = Array.from(tagElements || []).map(el => el.getAttribute('data-tag')).filter(Boolean);
      
      // Format dimensions properly
      const formattedDimensions = width && height ? `${width}x${height} ${unit || 'cm'}` : '';
      
      // Generate random UUID for product ID
      const uuid = crypto.randomUUID ? crypto.randomUUID() : 'PROD_' + Date.now();
      
      // Debug output
      console.log('Saving product with:');
      console.log('Type:', type);
      console.log('Material:', material);
      console.log('Color:', color);
      console.log('Quality Grade:', qualityGrade);
      console.log('Weight:', weight);
      console.log('Tags:', tags);
      console.log('Dimensions:', formattedDimensions);
      
      // Prepare the product data with all fields from ProductPattern schema
      const productData = {
        id: uuid,
        name: productName,
        code: productCode,
        type: type,
        material: material,
        color: color,
        dimensions: formattedDimensions,
        width: width,
        height: height,
        unit: unit,
        price: price,
        currency: 'INR',
        prompt: prompt,
        seed: document.querySelector('[data-seed]')?.getAttribute('data-seed') || '',
        imageUrl: resultImage,
        description: description,
        tags: tags,
        qualityGrade: qualityGrade,
        weight: weight,
        createdAt: new Date().toISOString()
      };
      
      // Save pattern using API
      const response = await axios.post('/api/products/patterns', productData);
      
      setError('');
      setShowProductDetails(false);
      
      // Reset form fields after saving
      setProductName("");
      setProductCode("");
      setDimensions("");
      setPrice("");
      
      // Show success notification using a styled toast instead of alert
      const toastContainer = document.createElement('div');
      toastContainer.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-[#1A1D24] rounded-lg border border-[#2A2F38] shadow-lg text-white text-xs z-50';
      toastContainer.textContent = 'Product saved successfully!';
      document.body.appendChild(toastContainer);
      
      // Remove toast after 3 seconds
      setTimeout(() => {
        if (toastContainer.parentNode) {
          document.body.removeChild(toastContainer);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(`Error saving product: ${error.message || 'Unknown error'}`);
    }
  };

  // Calculate dynamic heights based on container height
  const getImageContainerHeight = () => {
    const isMobile = window.innerWidth < 768;
    // Further increasing image container heights
    return isMobile ? Math.max(200, containerHeight * 0.35) : Math.max(250, containerHeight * 0.4);
  };

  const getControlsHeight = () => {
    const isMobile = window.innerWidth < 768;
    return isMobile ? Math.max(80, containerHeight * 0.1) : Math.max(90, containerHeight * 0.08);
  };

  const imageHeight = getImageContainerHeight();
  const imagePreviewHeight = Math.max(imageHeight - 40, 180);
  const controlsHeight = getControlsHeight();

  // Clear all stored data
  const clearAllData = () => {
    // Clear state
    setSourceImage(null);
    setResultImage(null);
    setPrompt('');
    setPreviewUrl('');
    setProductName('');
    setProductCode('');
    setDimensions('');
    setPrice('');
    
    // Clear localStorage
    localStorage.removeItem('textlaire_sourceImage');
    localStorage.removeItem('textlaire_previewUrl');
    localStorage.removeItem('textlaire_resultImage');
    localStorage.removeItem('textlaire_prompt');
    setError('');
  };

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left Side: Source, Result and Controls */}
      <div className="w-full md:w-2/3 h-full p-2 flex flex-col">
        <div className="flex-grow flex flex-col overflow-auto">
          {/* Images Row */}
          <div className="flex flex-wrap flex-shrink-0 h-[350px]">
            {/* Source Image */}
            <div className="w-full sm:w-1/2 pr-2 flex-1 h-full">
              <div className="bg-[#1A1D24] rounded-xl p-3 shadow-lg border border-[#2A2F38]/50 h-full flex flex-col">
                <h3 className="text-base font-medium text-white mb-2 flex items-center justify-between flex-shrink-0">
                  <span className="flex items-center text-white"><span className="mr-2">📁</span>Source Image</span>
                  {(sourceImage || resultImage) && (
                    <button 
                      onClick={clearAllData}
                      className="text-xs text-white hover:text-red-400 transition-colors"
                      title="Reset all image data"
                    >
                      Reset
                    </button>
                  )}
                </h3>
                
                <div
                  className="border-2 border-dashed rounded-lg p-3 bg-[#232830] border-[#2A2F38] flex flex-col items-center justify-center cursor-pointer overflow-hidden flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{ minHeight: '270px' }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Source"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-10 w-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-1 text-sm text-white">
                        Click to upload or drag and drop
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*"
                  />
                </div>
              </div>
            </div>

            {/* Result Image */}
            <div className="w-full sm:w-1/2 pl-2 flex-1 h-full">
              <div className="bg-[#1A1D24] rounded-xl p-3 shadow-lg border border-[#2A2F38]/50 h-full flex flex-col">
                <h3 className="text-base font-medium text-white mb-2 flex items-center justify-between flex-shrink-0">
                  <span className="flex items-center text-white"><span className="mr-2">✨</span>Generated Result</span>
                  {resultImage && !saveSuccess && (
                    <button 
                      onClick={saveGeneratedImage}
                      disabled={isSaving || !imageMetadata}
                      className={`text-xs px-2 py-1 rounded ${isSaving 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      title="Save this pattern to the server"
                    >
                      {isSaving ? 'Saving...' : 'Save Pattern'}
                    </button>
                  )}
                  {saveSuccess && (
                    <span className="text-xs px-2 py-1 rounded bg-green-800 text-green-200">
                      ✓ Saved
                    </span>
                  )}
                </h3>
                <div 
                  className="border-2 border-dashed rounded-lg p-3 bg-[#232830] border-[#2A2F38] flex flex-col items-center justify-center overflow-hidden flex-1 relative"
                  style={{ minHeight: '270px' }}
                >
                  {isLoading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-3 text-white">Generating image...</p>
                    </div>
                  ) : resultImage ? (
                    <>
                      <img
                        src={resultImage}
                        alt="Result"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                      {!saveSuccess && (
                        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-yellow-400">
                          Not saved to server yet. Click "Save Pattern" to store permanently.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-white">
                      Generated image will appear here
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="w-full mt-3 flex-shrink-0">
            <div className="bg-[#1A1D24] rounded-xl p-3 shadow-lg border border-[#2A2F38]/50">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#232830] border border-[#2A2F38] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Be specific with colors and quantities (e.g., 'Add exactly 10 royal blue butterflies in the foreground')"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Strength: {strength}
                    </label>
                    <input
                      type="range"
                      min="0.4"
                      max="0.9"
                      step="0.05"
                      value={strength}
                      onChange={(e) => setStrength(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#232830] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Steps: {steps}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={steps}
                      onChange={(e) => setSteps(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#232830] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Guidance: {guidance}
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="20"
                      step="0.5"
                      value={guidance}
                      onChange={(e) => setGuidance(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#232830] rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm mt-2">{error}</div>
                )}

                <div className="flex gap-3 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateImage}
                    disabled={isLoading || !sourceImage || !prompt}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      isLoading || !sourceImage || !prompt
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {isLoading ? 'Generating...' : 'Generate Image'}
                  </motion.button>
                  
                  {resultImage && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveProduct}
                      disabled={!productName}
                      className={`py-2 px-4 rounded-lg font-medium ${
                        !productName
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                      }`}
                    >
                      Save Product
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side: Product Details */}
      <div className="hidden md:block md:w-1/3 h-full p-2">
        <div className="bg-[#1A1D24] rounded-xl shadow-lg border border-[#2A2F38]/50 h-full overflow-hidden">
          {resultImage ? (
            <ProductDetails 
              id="product-details"
              productName={productName}
              setProductName={setProductName}
              productCode={productCode}
              setProductCode={setProductCode}
              dimensions={dimensions}
              setDimensions={setDimensions}
              price={price}
              setPrice={setPrice}
              prompt={prompt}
              seed={document.querySelector('[data-seed]')?.getAttribute('data-seed') || ''}
              type="Bath Towel"
              setType={(value) => {}} // We don't have state for this in parent component
              color=""
              setColor={(value) => {}} // We don't have state for this in parent component
            />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-white">
              <div>
                <svg className="mx-auto h-12 w-12 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm text-white">Product details will be available<br />after generating an image</p>
                {sourceImage && prompt ? (
                  <button 
                    onClick={generateImage}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-sm"
                  >
                    Generate Image
                  </button>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">
                    {!sourceImage && !prompt 
                      ? "Upload a source image and provide a prompt" 
                      : !sourceImage 
                        ? "Please upload a source image" 
                        : "Please provide a prompt"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageToImagePage;