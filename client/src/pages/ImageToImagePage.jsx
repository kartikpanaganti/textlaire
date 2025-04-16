import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { fal } from '@fal-ai/client';
import { randomSeed } from '../components/image-gen/utils';

// Import MUI components
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Slider,
  TextField,
  Typography,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Tab,
  Tabs,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';

import {
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  AddAPhoto as AddAPhotoIcon,
  Tune as TuneIcon,
  AutoFixHigh as AutoFixHighIcon,
  Download as DownloadIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Collections as CollectionsIcon,
  History as HistoryIcon,
  AddPhotoAlternate as AddPhotoIcon,
  Brush as BrushIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Import API client
import { 
  getAllImageResults,
  saveGeneratedImage,
  deleteGeneratedImage
} from '../lib/api';

// Import constants
import {
  DESIGN_PATTERNS,
  DESIGN_STYLES,
  DESIGN_ELEMENTS,
  PERSONALIZATION_OPTIONS,
  TEXT_PLACEMENT_OPTIONS,
  SAMPLE_PATTERNS,
  SEAMLESS_PATTERN_TYPES,
  TEXTILE_FINISHES,
  INPUT_DEFAULTS
} from '../components/image-gen/constants';

// Custom hook for viewport detection
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

function ImageToImagePage() {
  const theme = useTheme();
  
  // State variables
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImageFile, setSourceImageFile] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [seed, setSeed] = useState(randomSeed());
  const [inferenceTime, setInferenceTime] = useState(NaN);
  const [isLoading, setIsLoading] = useState(false);
  const [savedImages, setSavedImages] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageStrength, setImageStrength] = useState(0.85); // Increased from 0.7 for more transformation
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);

  // Reference to track loading interval
  const loadingInterval = useRef(null);
  
  // Configure API URL based on hostname or env var
  const API_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:5000' : 
      `//${window.location.host}`);

  // Add viewport size hook
  const viewport = useViewportSize();

  // Add new state variables for enhanced prompt generation
  const [designPattern, setDesignPattern] = useState(DESIGN_PATTERNS[0].id);
  const [designStyle, setDesignStyle] = useState(DESIGN_STYLES[0].id);
  const [designElement, setDesignElement] = useState(DESIGN_ELEMENTS[0]);
  const [customColor, setCustomColor] = useState("");
  const [textileFinish, setTextileFinish] = useState(TEXTILE_FINISHES[0]);
  const [patternScale, setPatternScale] = useState("medium");
  const [patternDensity, setPatternDensity] = useState("balanced");
  const [advancedPromptMode, setAdvancedPromptMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [seamlessType, setSeamlessType] = useState(SEAMLESS_PATTERN_TYPES[0].id);

  // Add personalization options
  const [personalization, setPersonalization] = useState("None");
  const [personalizationText, setPersonalizationText] = useState("");
  const [textPlacement, setTextPlacement] = useState("Corner");

  useEffect(() => {
    // Initialize fal.ai client
    const initializeClient = async () => {
      try {
        // Configure the fal client with the API key directly
        fal.config({
          credentials: "1e769e5b-6ac4-40f9-8bd7-0df79ac00ce2:a35d94f5890a7f218d27b886df9cb678"
        });
        console.log('Fal client initialized successfully');
      } catch (error) {
        console.error('Error initializing fal client:', error);
        setErrorMessage("Failed to initialize image generation service.");
      }
    };

    initializeClient();
    loadSavedImages();
  }, []);

  // Load saved images
  const loadSavedImages = async () => {
    try {
      const images = await getAllImageResults();
      setSavedImages(images);
    } catch (error) {
      console.error('Error loading saved images:', error);
    }
  };

  // Handle source image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSourceImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSourceImage(e.target.result);
        setHistory([e.target.result]);
        setHistoryIndex(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle canvas drawing
  const handleCanvasMouseDown = (e) => {
    if (!sourceImage) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isErasing ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.5)';
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !sourceImage) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    if (!sourceImage) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
  };

  // Handle transformation
  const handleTransform = async () => {
    if (!sourceImage || !prompt) return;
    
    setIsLoading(true);
    try {
      // Here you would implement the actual transformation logic
      // For now, we'll just simulate it
      const result = await new Promise(resolve => setTimeout(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = sourceImage;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Apply transformation based on selected area and strength
        if (selectedArea) {
          // Apply transformation only to selected area
          const mask = canvasRef.current;
          const maskCtx = mask.getContext('2d');
          const imageData = maskCtx.getImageData(0, 0, mask.width, mask.height);
          
          // Process the image based on the mask
          // This is where you would implement the selective transformation
        }
        
        resolve(canvas.toDataURL());
      }, 2000));
      
      setResultImage(result);
      setHistory(prev => [...prev.slice(0, historyIndex + 1), result]);
      setHistoryIndex(prev => prev + 1);
    } catch (error) {
      console.error('Transformation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle undo/redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setSourceImage(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setSourceImage(history[historyIndex + 1]);
    }
  };

  // Add function to generate enhanced prompt
  const generateEnhancedPrompt = () => {
    if (advancedPromptMode) {
      return customPrompt;
    }

    // Get selected style details
    const selectedStyle = DESIGN_STYLES.find(s => s.id === designStyle);
    const selectedSeamlessType = SEAMLESS_PATTERN_TYPES.find(t => t.id === seamlessType);
    
    let enhancedPrompt = "";

    // Base transformation request
    enhancedPrompt += "Transform the source image while maintaining its core elements, ";

    // Add style and technique
    enhancedPrompt += `applying ${selectedStyle.name} style with ${selectedStyle.technique}, `;

    // Add color customization
    if (customColor) {
      enhancedPrompt += `shifting the color palette towards ${customColor} tones while maintaining harmony, `;
    }

    // Add pattern modifications
    enhancedPrompt += `adjusting to ${patternScale} scale and ${patternDensity} pattern density, `;

    // Add seamless pattern specifications if selected
    if (selectedSeamlessType) {
      enhancedPrompt += `creating a ${selectedSeamlessType.name.toLowerCase()} seamless pattern that tiles perfectly, `;
      enhancedPrompt += "with mathematically precise edges ensuring no visible seams when repeated, ";
    }

    // Add textile finish
    enhancedPrompt += `optimized for ${textileFinish.toLowerCase()} finish, `;

    // Add personalization if selected
    if (personalization !== "None" && personalizationText) {
      enhancedPrompt += `incorporating ${personalization.toLowerCase()} "${personalizationText}" `;
      enhancedPrompt += `elegantly placed in the ${textPlacement.toLowerCase()}, `;
      enhancedPrompt += "harmoniously integrated into the overall design, ";
    }

    // Add quality specifications
    enhancedPrompt += "maintaining professional quality with perfect color balance and clarity. ";
    enhancedPrompt += "Preserve important details while enhancing overall aesthetic appeal. ";

    return enhancedPrompt;
  };

  // Modify the generateImage function to use the enhanced prompt
  const generateImage = async () => {
    if (!sourceImageFile) {
      setErrorMessage("Please upload a source image first.");
      return;
    }

    const enhancedPrompt = generateEnhancedPrompt();
    if (!enhancedPrompt) {
      setErrorMessage("Please provide a prompt or customization options.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(0);
      setErrorMessage("");

      // Start loading animation
      loadingInterval.current = setInterval(() => {
        setLoadingProgress((prevProgress) => {
          if (prevProgress >= 95) return 95;
          return prevProgress + 2;
        });
      }, 1000);

      // Convert the file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(sourceImageFile);
      const base64Data = await base64Promise;

      console.log('Calling fal.ai with enhanced prompt:', enhancedPrompt);
      setErrorMessage("Submitting request to AI service...");

      try {
        const result = await fal.subscribe("fal-ai/fast-lightning-sdxl/image-to-image", {
          input: {
            image_url: base64Data,
            prompt: enhancedPrompt,
            seed: parseInt(seed, 10),
            strength: parseFloat(imageStrength),
            num_inference_steps: 8,
            guidance_scale: 7.5,
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("Generation in progress:", update);
              setErrorMessage("AI is generating your image...");
            }
          },
        });
        
        console.log('Received result from fal.ai:', result);
        setErrorMessage(""); // Clear status
  
        // Clear interval and set progress to 100%
        clearInterval(loadingInterval.current);
        setLoadingProgress(100);
  
        // Check for data property in result (fal.ai client response structure)
        if (result && result.data) {
          if (result.data.images && result.data.images.length > 0) {
            setResultImage(result.data.images[0].url);
            setInferenceTime(result.data.timings?.inference || 0);
          } else if (result.images && result.images.length > 0) {
            // Fallback to top-level images property
            setResultImage(result.images[0].url);
            setInferenceTime(result.timings?.inference || 0);
          } else {
            throw new Error("No images found in response");
          }
        } else if (result && result.images && result.images.length > 0) {
          // Legacy response format
          setResultImage(result.images[0].url);
          setInferenceTime(result.timings?.inference || 0);
        } else {
          throw new Error("Invalid response from image generation API");
        }
      } catch (directError) {
        console.error('Error with direct fal.ai call:', directError);
        setErrorMessage(`Direct fal.ai call failed: ${directError.message}. Trying server proxy...`);
        
        // Fallback to server proxy if direct call fails
        try {
          const response = await fetch(`${API_URL}/api/fal/image-to-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageData: base64Data,
              prompt: enhancedPrompt,
              seed: seed,
              strength: imageStrength
            })
          });
          
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate image');
            } catch (e) {
              throw new Error(`Server error: ${response.status}`);
            }
          }
          
          const result = await response.json();
          console.log('Received result from server proxy:', result);
          
          // Clear interval and set progress to 100%
          clearInterval(loadingInterval.current);
          setLoadingProgress(100);
          setErrorMessage(""); // Clear status
    
          // Set result image
          if (result && result.images && result.images[0]) {
            setResultImage(result.images[0].url);
            setInferenceTime(result.timings?.inference || 0);
          } else {
            throw new Error("Invalid response from server proxy");
          }
        } catch (proxyError) {
          console.error('Error with server proxy:', proxyError);
          throw new Error(`Both direct and proxy attempts failed: ${directError.message} & ${proxyError.message}`);
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      clearInterval(loadingInterval.current);
      setLoadingProgress(0); // Reset progress
      setErrorMessage(`Failed to generate image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save generated image to database
  const saveImage = async () => {
    if (!resultImage) {
      setErrorMessage("No image to save.");
      return;
    }

    try {
      const response = await saveGeneratedImage({
        originalImage: sourceImage,
        generatedImage: resultImage,
        prompt: prompt,
        seed: seed,
        strength: imageStrength,
        timestamp: new Date().toISOString()
      });

      if (response && response.success) {
        // Refresh the saved images list
        loadSavedImages();
      }
    } catch (error) {
      console.error('Error saving image:', error);
      setErrorMessage("Failed to save image.");
    }
  };

  // Delete saved image
  const deleteImage = async (imageId) => {
    try {
      await deleteGeneratedImage(imageId);
      // Refresh the saved images list
      loadSavedImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      setErrorMessage("Failed to delete image.");
    }
  };

  // Download generated image
  const downloadImage = () => {
    if (!resultImage) {
      setErrorMessage("No image to download.");
      return;
    }

    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `image-to-image-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Inside the renderCustomizationControls function, add the controls and the transform button:
  const renderCustomizationControls = () => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Customization Options
      </Typography>
      <Grid container spacing={2}>
        {/* Advanced Mode Toggle */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={advancedPromptMode}
                onChange={(e) => setAdvancedPromptMode(e.target.checked)}
              />
            }
            label="Advanced Prompt Mode"
          />
        </Grid>

        {advancedPromptMode ? (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Custom Prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              helperText="Write your own detailed prompt for complete control"
            />
          </Grid>
        ) : (
          <>
            {/* Style Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Design Style</InputLabel>
                <Select
                  value={designStyle}
                  onChange={(e) => setDesignStyle(e.target.value)}
                  label="Design Style"
                >
                  {DESIGN_STYLES.map((style) => (
                    <MenuItem key={style.id} value={style.id}>
                      {style.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Color Customization */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Custom Color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="e.g., deep blue, warm red"
              />
            </Grid>

            {/* Pattern Scale */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Pattern Scale</InputLabel>
                <Select
                  value={patternScale}
                  onChange={(e) => setPatternScale(e.target.value)}
                  label="Pattern Scale"
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Pattern Density */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Pattern Density</InputLabel>
                <Select
                  value={patternDensity}
                  onChange={(e) => setPatternDensity(e.target.value)}
                  label="Pattern Density"
                >
                  <MenuItem value="sparse">Sparse</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                  <MenuItem value="dense">Dense</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Textile Finish */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Textile Finish</InputLabel>
                <Select
                  value={textileFinish}
                  onChange={(e) => setTextileFinish(e.target.value)}
                  label="Textile Finish"
                >
                  {TEXTILE_FINISHES.map((finish) => (
                    <MenuItem key={finish} value={finish}>
                      {finish}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Seamless Pattern Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Seamless Pattern Type</InputLabel>
                <Select
                  value={seamlessType}
                  onChange={(e) => setSeamlessType(e.target.value)}
                  label="Seamless Pattern Type"
                >
                  {SEAMLESS_PATTERN_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Personalization Options */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Personalization</InputLabel>
                <Select
                  value={personalization}
                  onChange={(e) => setPersonalization(e.target.value)}
                  label="Personalization"
                >
                  {PERSONALIZATION_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {personalization !== "None" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Personalization Text"
                    value={personalizationText}
                    onChange={(e) => setPersonalizationText(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Text Placement</InputLabel>
                    <Select
                      value={textPlacement}
                      onChange={(e) => setTextPlacement(e.target.value)}
                      label="Text Placement"
                    >
                      {TEXT_PLACEMENT_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </>
        )}

        {/* Transformation Strength Slider */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Transformation Strength: {imageStrength.toFixed(2)}
          </Typography>
          <Box sx={{ px: 2 }}>
            <Slider
              value={imageStrength}
              onChange={(_, value) => setImageStrength(value)}
              min={0.25}
              max={0.95}
              step={0.05}
              marks={[
                { value: 0.25, label: 'Subtle' },
                { value: 0.6, label: 'Balanced' },
                { value: 0.95, label: 'Complete' }
              ]}
              sx={{
                '& .MuiSlider-thumb': {
                  width: 24,
                  height: 24,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.16)}`
                  }
                }
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Higher values produce more dramatic transformations
          </Typography>
        </Grid>

        {/* Seed Control */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label="Generation Seed"
              variant="outlined"
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value))}
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{
                sx: { borderRadius: 2 }
              }}
            />
            <IconButton 
              onClick={() => setSeed(randomSeed())}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2)
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Use the same seed to reproduce results
          </Typography>
        </Grid>

        {/* Transform Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<AutoFixHighIcon />}
            onClick={generateImage}
            disabled={isLoading || !sourceImage}
            sx={{
              mt: 2,
              height: 56,
              borderRadius: 2,
              background: theme.palette.primary.gradient,
              '&:hover': {
                background: theme.palette.primary.gradientHover
              }
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} color="inherit" />
                <span>Transforming... {Math.round(loadingProgress)}%</span>
              </Box>
            ) : (
              'Transform Image'
            )}
          </Button>
        </Grid>

        {/* Error Message */}
        {errorMessage && (
          <Grid item xs={12}>
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ mt: 2, textAlign: 'center' }}
            >
              {errorMessage}
            </Typography>
          </Grid>
        )}

        {/* Generation Time */}
        {!isNaN(inferenceTime) && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Generation time: {inferenceTime.toFixed(2)}s
            </Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        minHeight: '100%',
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.05)}, ${alpha(theme.palette.secondary.dark, 0.05)})`
          : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.05)}, ${alpha(theme.palette.secondary.light, 0.05)})`,
        pt: 1,
        pb: 2,
        overflow: 'auto'
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 2, md: 3 }, 
              mb: 3, 
              borderRadius: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: 3
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                AI Image Transformation
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                Transform your images using advanced AI. Upload, enhance, and create stunning variations.
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<AddAPhotoIcon />}
                onClick={() => setActiveTab(0)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  background: theme.palette.primary.gradient
                }}
              >
                Create New
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PhotoLibraryIcon />}
                onClick={() => setActiveTab(1)}
                sx={{ borderRadius: 2, px: 3 }}
              >
                View Gallery
              </Button>
            </Box>
          </Paper>

          <Grid container spacing={4}>
            {/* Main content area */}
            <Grid item xs={12} lg={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    height: '100%'
                  }}
                >
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                    <Tabs 
                      value={activeTab} 
                      onChange={handleTabChange} 
                      variant="fullWidth" 
                      sx={{
                        '& .MuiTab-root': {
                          py: 2,
                          fontSize: '1rem',
                          textTransform: 'none'
                        }
                      }}
                    >
                      <Tab 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AddAPhotoIcon />
                            <span>Create</span>
                          </Box>
                        }
                      />
                      <Tab 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PhotoLibraryIcon />
                            <span>Gallery</span>
                          </Box>
                        }
                      />
                    </Tabs>
                  </Box>

                  <Box sx={{ p: 3 }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {activeTab === 0 ? (
                          <Box>
                            <Grid container spacing={3}>
                              {/* Image Preview Section */}
                              <Grid item xs={12}>
                                <Paper 
                                  elevation={2} 
                                  sx={{ 
                                    p: 3,
                                    background: alpha(theme.palette.background.default, 0.5),
                                    borderRadius: 2
                                  }}
                                >
                                  <Grid container spacing={3}>
                                    {/* Source Image */}
                                    <Grid item xs={12} md={6}>
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Box
                                          sx={{
                                            position: 'relative',
                                            height: 400,
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            boxShadow: theme.shadows[4],
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                          }}
                                        >
                                          {sourceImage ? (
                                            <>
                                              <Box
                                                component="img"
                                                src={sourceImage}
                                                sx={{
                                                  width: '100%',
                                                  height: '100%',
                                                  objectFit: 'cover'
                                                }}
                                                alt="Source"
                                              />
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  right: 0,
                                                  p: 2,
                                                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}
                                              >
                                                <Typography color="white" variant="subtitle1">
                                                  Source Image
                                                </Typography>
                                                <IconButton
                                                  size="small"
                                                  sx={{ color: 'white' }}
                                                  onClick={() => {
                                                    setSourceImage(null);
                                                    setSourceImageFile(null);
                                                  }}
                                                >
                                                  <DeleteIcon />
                                                </IconButton>
                                              </Box>
                                            </>
                                          ) : (
                                            <Box
                                              sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                                                border: `2px dashed ${theme.palette.divider}`
                                              }}
                                            >
                                              <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id="upload-image-button"
                                                type="file"
                                                onChange={handleImageUpload}
                                              />
                                              <label htmlFor="upload-image-button">
                                                <Button
                                                  variant="contained"
                                                  component="span"
                                                  startIcon={<CloudUploadIcon />}
                                                  sx={{
                                                    mb: 2,
                                                    background: theme.palette.primary.gradient
                                                  }}
                                                >
                                                  Upload Image
                                                </Button>
                                              </label>
                                              <Typography variant="body2" color="text.secondary">
                                                Drag & drop or click to upload
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </motion.div>
                                    </Grid>

                                    {/* Result Image */}
                                    <Grid item xs={12} md={6}>
                                      <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Box
                                          sx={{
                                            position: 'relative',
                                            height: 400,
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            boxShadow: theme.shadows[4],
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                                          }}
                                        >
                                          {isLoading ? (
                                            <Box
                                              sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: alpha(theme.palette.background.paper, 0.8)
                                              }}
                                            >
                                              <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                              >
                                                <CircularProgress
                                                  variant="determinate"
                                                  value={loadingProgress}
                                                  size={80}
                                                  thickness={4}
                                                  sx={{
                                                    color: theme.palette.primary.main,
                                                    mb: 2
                                                  }}
                                                />
                                              </motion.div>
                                              <Typography variant="h6" sx={{ mb: 1 }}>
                                                Generating...
                                              </Typography>
                                              <Typography variant="body2" color="text.secondary">
                                                {Math.round(loadingProgress)}% complete
                                              </Typography>
                                            </Box>
                                          ) : resultImage ? (
                                            <>
                                              <Box
                                                component="img"
                                                src={resultImage}
                                                sx={{
                                                  width: '100%',
                                                  height: '100%',
                                                  objectFit: 'cover'
                                                }}
                                                alt="Generated"
                                              />
                                              <Box
                                                sx={{
                                                  position: 'absolute',
                                                  bottom: 0,
                                                  left: 0,
                                                  right: 0,
                                                  p: 2,
                                                  background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}
                                              >
                                                <Typography color="white" variant="subtitle1">
                                                  Generated Result
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                  <IconButton
                                                    size="small"
                                                    sx={{
                                                      color: 'white',
                                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                                    }}
                                                    onClick={saveImage}
                                                  >
                                                    <SaveIcon />
                                                  </IconButton>
                                                  <IconButton
                                                    size="small"
                                                    sx={{
                                                      color: 'white',
                                                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                                                    }}
                                                    onClick={downloadImage}
                                                  >
                                                    <DownloadIcon />
                                                  </IconButton>
                                                </Box>
                                              </Box>
                                            </>
                                          ) : (
                                            <Box
                                              sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                                                border: `2px dashed ${theme.palette.divider}`
                                              }}
                                            >
                                              <ImageIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                              <Typography variant="body1" color="text.secondary">
                                                Generated image will appear here
                                              </Typography>
                                            </Box>
                                          )}
                                        </Box>
                                      </motion.div>
                                    </Grid>
                                  </Grid>
                                </Paper>
                              </Grid>

                              {/* Controls Section */}
                              <Grid item xs={12}>
                                <Paper 
                                  elevation={2} 
                                  sx={{ 
                                    p: 3,
                                    borderRadius: 2,
                                    background: alpha(theme.palette.background.paper, 0.8),
                                    backdropFilter: 'blur(10px)'
                                  }}
                                >
                                  {renderCustomizationControls()}
                                </Paper>
                              </Grid>
                            </Grid>
                          </Box>
                        ) : (
                          // Gallery View
                          <Box>
                            {savedImages.length > 0 ? (
                              <Grid container spacing={3}>
                                {savedImages.map((image, index) => (
                                  <Grid item xs={12} sm={6} md={4} key={image.id}>
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                      <Card 
                                        sx={{ 
                                          height: '100%',
                                          borderRadius: 2,
                                          overflow: 'hidden',
                                          transition: 'transform 0.2s',
                                          '&:hover': {
                                            transform: 'scale(1.02)'
                                          }
                                        }}
                                      >
                                        <Box sx={{ position: 'relative' }}>
                                          <CardMedia
                                            component="img"
                                            height="200"
                                            image={image.generatedImage}
                                            alt={image.prompt}
                                            sx={{ objectFit: 'cover' }}
                                          />
                                          <Box
                                            sx={{
                                              position: 'absolute',
                                              bottom: 0,
                                              left: 0,
                                              right: 0,
                                              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                              p: 2
                                            }}
                                          >
                                            <Typography variant="subtitle1" color="white" noWrap>
                                              {new Date(image.timestamp).toLocaleDateString()}
                                            </Typography>
                                          </Box>
                                        </Box>
                                        <CardContent>
                                          <Typography variant="body2" color="text.secondary" sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            mb: 1
                                          }}>
                                            {image.prompt}
                                          </Typography>
                                        </CardContent>
                                        <CardActions sx={{ p: 2, pt: 0 }}>
                                          <Button 
                                            size="small" 
                                            startIcon={<ImageIcon />}
                                            onClick={() => setSelectedImage(image)}
                                            sx={{ mr: 1 }}
                                          >
                                            View
                                          </Button>
                                          <Button 
                                            size="small" 
                                            color="error" 
                                            startIcon={<DeleteIcon />}
                                            onClick={() => deleteImage(image.id)}
                                          >
                                            Delete
                                          </Button>
                                        </CardActions>
                                      </Card>
                                    </motion.div>
                                  </Grid>
                                ))}
                              </Grid>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                              >
                                <Box 
                                  sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    py: 8
                                  }}
                                >
                                  <CollectionsIcon 
                                    sx={{ 
                                      fontSize: 100, 
                                      color: alpha(theme.palette.primary.main, 0.2),
                                      mb: 3
                                    }} 
                                  />
                                  <Typography variant="h5" gutterBottom>
                                    No saved images yet
                                  </Typography>
                                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                    Start by creating and saving some amazing transformations
                                  </Typography>
                                  <Button 
                                    variant="contained"
                                    size="large"
                                    startIcon={<AddAPhotoIcon />}
                                    onClick={() => setActiveTab(0)}
                                    sx={{
                                      borderRadius: 2,
                                      px: 4,
                                      background: theme.palette.primary.gradient
                                    }}
                                  >
                                    Create New Image
                                  </Button>
                                </Box>
                              </motion.div>
                            )}
                          </Box>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 3,
                    borderRadius: 3,
                    background: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: theme.palette.primary.main
                    }}
                  >
                    <TuneIcon />
                    How It Works
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  {[
                    {
                      title: "Upload a Source Image",
                      icon: <CloudUploadIcon />,
                      description: "Start by uploading any image you want to transform."
                    },
                    {
                      title: "Enter a Prompt",
                      icon: <AutoFixHighIcon />,
                      description: "Describe how you want the AI to transform your image. Be specific and detailed."
                    },
                    {
                      title: "Adjust Settings",
                      icon: <TuneIcon />,
                      description: "Fine-tune the transformation strength and other parameters to get your desired result."
                    },
                    {
                      title: "Generate & Save",
                      icon: <SaveIcon />,
                      description: "Click generate and watch the AI transform your image. Save your favorites to the gallery."
                    }
                  ].map((step, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        background: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateX(8px)',
                          background: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box
                          sx={{
                            mr: 2,
                            p: 1,
                            borderRadius: 1,
                            background: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        >
                          {step.icon}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {step.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    </Box>
                  ))}

                  <Divider sx={{ my: 3 }} />
                  
                  <Typography 
                    variant="subtitle1" 
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: theme.palette.primary.main
                    }}
                  >
                    <HistoryIcon />
                    Recent Activity
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    {savedImages.slice(0, 3).map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 2,
                            p: 1.5,
                            borderRadius: 2,
                            background: alpha(theme.palette.background.default, 0.5),
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          <Box
                            component="img"
                            src={image.generatedImage}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              objectFit: 'cover'
                            }}
                          />
                          <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography 
                              variant="body2" 
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {image.prompt}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(image.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}

export default ImageToImagePage; 