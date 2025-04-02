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
  alpha
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
  History as HistoryIcon
} from '@mui/icons-material';

// Import API client
import { 
  getAllImageResults,
  saveGeneratedImage,
  deleteGeneratedImage
} from '../lib/api';

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

  // Reference to track loading interval
  const loadingInterval = useRef(null);
  
  // Configure API URL based on hostname or env var
  const API_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 
      'http://localhost:5000' : 
      `//${window.location.host}`);

  // Add viewport size hook
  const viewport = useViewportSize();

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
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate image from source image and prompt
  const generateImage = async () => {
    if (!sourceImageFile) {
      setErrorMessage("Please upload a source image first.");
      return;
    }

    if (!prompt) {
      setErrorMessage("Please enter a prompt to guide the image generation.");
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(0);
      setErrorMessage("");

      // Start loading animation
      loadingInterval.current = setInterval(() => {
        setLoadingProgress((prevProgress) => {
          if (prevProgress >= 95) {
            return 95;
          }
          return prevProgress + 2; // Slower progression
        });
      }, 1000); // Longer interval

      // Convert the file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(sourceImageFile);
      const base64Data = await base64Promise;

      console.log('Calling fal.ai directly with prompt:', prompt, 'and seed:', seed);
      setErrorMessage("Submitting request to AI service..."); // Status update
      
      // Direct API call to fal.ai - bypassing the server proxy
      try {
        // Use fal.ai client directly with improved accuracy settings
        const result = await fal.subscribe("fal-ai/fast-lightning-sdxl/image-to-image", {
          input: {
            image_url: base64Data,
            prompt: prompt,
            seed: parseInt(seed, 10),
            strength: parseFloat(imageStrength),
            num_inference_steps: 8, // Increase from default 4 to 8 for higher accuracy
            guidance_scale: 7.5, // Add guidance scale for better prompt adherence
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
              prompt: prompt,
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h4" gutterBottom>
          Image-to-Image Generation
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Transform your images using AI. Upload an image and provide a prompt to guide the transformation.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Main content area */}
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2 
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="fullWidth" 
              sx={{ mb: 3 }}
            >
              <Tab label="Create" icon={<AddAPhotoIcon />} iconPosition="start" />
              <Tab label="Gallery" icon={<PhotoLibraryIcon />} iconPosition="start" />
            </Tabs>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {activeTab === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Grid container spacing={3}>
                      {/* Source image section */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            height: '100%',
                            minHeight: 300,
                            background: alpha(theme.palette.background.default, 0.5)
                          }}
                        >
                          <Typography variant="h6" gutterBottom>Source Image</Typography>
                          
                          {sourceImage ? (
                            <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                              <Box
                                component="img"
                                src={sourceImage}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  borderRadius: 1
                                }}
                                alt="Source"
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  bgcolor: 'background.paper'
                                }}
                                onClick={() => {
                                  setSourceImage(null);
                                  setSourceImageFile(null);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px dashed ${theme.palette.divider}`,
                                borderRadius: 2,
                                p: 3,
                                width: '100%',
                                height: 300
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
                                >
                                  Upload Image
                                </Button>
                              </label>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                Drag & drop or click to upload
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>

                      {/* Result image section */}
                      <Grid item xs={12} md={6}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            height: '100%',
                            minHeight: 300,
                            background: alpha(theme.palette.background.default, 0.5)
                          }}
                        >
                          <Typography variant="h6" gutterBottom>Result Image</Typography>
                          
                          {isLoading ? (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                height: 300,
                                width: '100%'
                              }}
                            >
                              <CircularProgress 
                                variant="determinate" 
                                value={loadingProgress} 
                                size={60} 
                                thickness={4}
                                sx={{ mb: 2 }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                Generating image... {Math.round(loadingProgress)}%
                              </Typography>
                            </Box>
                          ) : resultImage ? (
                            <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                              <Box
                                component="img"
                                src={resultImage}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  borderRadius: 1
                                }}
                                alt="Generated"
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 8,
                                  right: 8,
                                  display: 'flex',
                                  gap: 1
                                }}
                              >
                                <Tooltip title="Save">
                                  <IconButton 
                                    size="small" 
                                    sx={{ bgcolor: 'background.paper' }}
                                    onClick={saveImage}
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download">
                                  <IconButton 
                                    size="small" 
                                    sx={{ bgcolor: 'background.paper' }}
                                    onClick={downloadImage}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `2px dashed ${theme.palette.divider}`,
                                borderRadius: 2,
                                p: 3,
                                width: '100%',
                                height: 300
                              }}
                            >
                              <Typography variant="body2" color="text.secondary">
                                Generated image will appear here
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Error message */}
                    {errorMessage && (
                      <Typography 
                        variant="body2" 
                        color="error" 
                        sx={{ mt: 2, textAlign: 'center' }}
                      >
                        {errorMessage}
                      </Typography>
                    )}

                    {/* Image processing stats */}
                    {resultImage && !isNaN(inferenceTime) && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Generation time: {inferenceTime.toFixed(2)}s
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Controls for image generation */}
                    <Paper 
                      elevation={2} 
                      sx={{ 
                        p: 3, 
                        mt: 3,
                        borderRadius: 2
                      }}
                    >
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            label="Prompt"
                            placeholder="Be specific and detailed. Example: 'Convert the pink roses to vibrant yellow roses with dewdrops, morning sunlight, professional photography, high detail'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            helperText="More detailed prompts lead to more accurate results. Include colors, styles, lighting, and details you want to see."
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography id="strength-slider" gutterBottom>
                            Transformation Strength: {imageStrength.toFixed(2)}
                          </Typography>
                          <Slider
                            aria-labelledby="strength-slider"
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
                          />
                          <Typography variant="caption" color="text.secondary">
                            Higher values produce more accurate transformations based on your prompt
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography id="seed-input" gutterBottom>
                            Seed (for reproducibility)
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                              fullWidth
                              variant="outlined"
                              type="number"
                              value={seed}
                              onChange={(e) => setSeed(parseInt(e.target.value))}
                              size="small"
                            />
                            <IconButton 
                              onClick={() => setSeed(randomSeed())}
                              sx={{ ml: 1 }}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </Box>
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AutoFixHighIcon />}
                            onClick={generateImage}
                            disabled={isLoading || !sourceImage || !prompt}
                          >
                            {isLoading ? 'Generating...' : 'Generate Image'}
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                ) : (
                  // Gallery tab
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {savedImages.length > 0 ? (
                      <Grid container spacing={2}>
                        {savedImages.map((image) => (
                          <Grid item xs={12} sm={6} md={4} key={image.id}>
                            <Card sx={{ height: '100%' }}>
                              <CardMedia
                                component="img"
                                height="200"
                                image={image.generatedImage}
                                alt={image.prompt}
                                sx={{ objectFit: 'cover' }}
                              />
                              <CardContent sx={{ height: 80, overflow: 'hidden' }}>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {image.prompt}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(image.timestamp).toLocaleString()}
                                </Typography>
                              </CardContent>
                              <CardActions>
                                <Button 
                                  size="small" 
                                  startIcon={<ImageIcon />}
                                  onClick={() => setSelectedImage(image)}
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
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flex: 1
                        }}
                      >
                        <CollectionsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No saved images yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Generate and save images to see them here
                        </Typography>
                        <Button 
                          variant="outlined" 
                          sx={{ mt: 2 }}
                          onClick={() => setActiveTab(0)}
                        >
                          Create new image
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </motion.div>
            </AnimatePresence>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3,
              borderRadius: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              <TuneIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              How It Works
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                1. Upload a Source Image
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start by uploading any image you want to transform.
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                2. Enter a Prompt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Describe how you want the AI to transform your image.
                For example: "an island near sea, with seagulls, moon shining over the sea"
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                3. Adjust Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control how much the AI transforms your image using the strength slider.
                Higher values create more dramatic changes.
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                4. Generate & Save
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Generate Image" and wait for the AI to work its magic.
                Save or download your results when done.
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: 'small' }} />
              Recent Activity
            </Typography>
            
            {savedImages.slice(0, 3).map((image, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mt: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <Box
                  component="img"
                  src={image.generatedImage}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    objectFit: 'cover'
                  }}
                />
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                    {image.prompt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(image.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ImageToImagePage; 