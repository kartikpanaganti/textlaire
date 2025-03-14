const SEAMLESS_PATTERN_TYPES = [
  {
    id: "continuous",
    name: "Continuous Flow",
    description: "Smooth, uninterrupted pattern that flows seamlessly in all directions",
    prompt: "true seamless tileable pattern with perfect edge matching and continuous flow across borders, mathematically perfect repeating pattern with absolutely no visible seams or edges, pixel-perfect alignment when tiled"
  },
  {
    id: "mirrored",
    name: "Mirrored",
    description: "Symmetrical pattern that mirrors perfectly at edges",
    prompt: "true seamless tileable pattern with perfect mirror symmetry at all edges, mathematically perfect repeating pattern with exact edge alignment, pixel-perfect symmetry when tiled"
  },
  {
    id: "rotational",
    name: "Rotational",
    description: "Pattern that rotates around central points for perfect tiling",
    prompt: "true seamless tileable pattern with perfect 4-fold rotational symmetry, mathematically perfect repeating pattern with exact corner alignment, pixel-perfect rotation points when tiled"
  },
  {
    id: "halfdrop",
    name: "Half-Drop",
    description: "Pattern that repeats with a vertical offset",
    prompt: "true seamless half-drop repeat pattern, mathematically perfect repeating pattern with exact vertical offset alignment, pixel-perfect matching when tiled"
  },
  {
    id: "brick",
    name: "Brick",
    description: "Pattern that repeats with a horizontal offset",
    prompt: "true seamless brick repeat pattern, mathematically perfect repeating pattern with exact horizontal offset alignment, pixel-perfect matching when tiled"
  },
  {
    id: "diamond",
    name: "Diamond Grid",
    description: "Pattern arranged in a perfect diamond grid",
    prompt: "true seamless diamond grid pattern, mathematically perfect repeating pattern with exact diagonal symmetry, pixel-perfect alignment when tiled"
  }
];

// Default pattern configuration
const DEFAULT_PATTERN = {
  id: 'default',
  description: 'elegant repeating pattern',
  type: 'continuous'
};

const DEFAULT_CONFIG = {
  designStyle: 'modern',
  application: 'casual',
  textileFinish: 'smooth',
  patternScale: 'medium',
  patternDensity: 'balanced',
  personalization: 'None',
  personalizationText: '',
  textPlacement: 'center',
  customColor: '',
};

const generateImageWithParams = async (params) => {
  // Ensure params has all required fields with defaults
  const safeParams = {
    ...DEFAULT_CONFIG,
    ...params,
    selectedPattern: params.selectedPattern || DEFAULT_PATTERN,
    seamlessType: params.seamlessType || 'continuous'
  };

  const seamlessType = SEAMLESS_PATTERN_TYPES.find(t => t.id === safeParams.seamlessType);
  const seamlessPrompt = seamlessType?.prompt || SEAMLESS_PATTERN_TYPES[0].prompt;

  const basePrompt = `${seamlessPrompt}, ${safeParams.selectedPattern.description}, ${safeParams.customPrompt || ''}`.trim();
  
  const enhancedPrompt = `
    true seamless tileable pattern for textiles with perfect edge matching, when multiple tiles are placed side by side they must appear as one continuous design with absolutely no visible seams or joins,
    ${basePrompt},
    textile design for towel,
    ${safeParams.designStyle} technique,
    ${safeParams.customColor ? `color scheme: ${safeParams.customColor},` : ''}
    ${safeParams.application} style,
    ${safeParams.textileFinish} finish,
    ${safeParams.patternScale} scale pattern,
    ${safeParams.patternDensity} pattern density,
    ${safeParams.personalization !== 'None' ? `with ${safeParams.personalization} personalization ${safeParams.personalizationText} at ${safeParams.textPlacement}` : ''},
    mathematically perfect edge alignment, pixel-perfect seamless tiling, absolutely no visible seams or interruptions when tiled in any grid formation,
    high-end textile design, ultra-detailed, professional quality, perfect for manufacturing
  `.replace(/\s+/g, ' ').trim();

  const negativePrompt = `
    seams, joins, edges, borders, edge artifacts, tiling errors, misaligned edges, pattern interruptions, 
    asymmetric edges, uneven borders, pattern breaks, misaligned repeats, edge discontinuities,
    irregular spacing, distorted elements, inconsistent scale, blurry edges, edge mismatch,
    watermarks, signatures, text, jpeg artifacts, low quality, noise, grain, visible repetition,
    perspective, 3d effects, shadows, gradients, uneven lighting, non-seamless, edge detection
  `.replace(/\s+/g, ' ').trim();

  // Optimized technical parameters specifically for perfect seamless pattern generation
  const technicalParams = {
    seed: -1, // Random seed for variation
    cfg_scale: 10, // Very high CFG scale for exact prompt adherence
    steps: 50, // More steps for higher quality
    width: 1024, // Larger size for better edge detail
    height: 1024, // Square aspect ratio for perfect tiling
    sampler_name: "DPM++ SDE Karras", // Advanced sampler for perfect edge matching
    clip_skip: 2, // Skip CLIP text encoder layers for better pattern generation
    negative_prompt: negativePrompt,
    prompt: enhancedPrompt,
    denoising_strength: 0.6, // Lower denoising for cleaner edges
    batch_size: 1,
    n_iter: 1,
    restore_faces: false,
    tiling: true, // Enable tiling mode
    enable_hr: true, // Enable high-res fix for better edge detail
    hr_scale: 1.5, // Scale factor for high-res fix
    hr_upscaler: "Latent", // Upscaler that preserves seamless edges
    hr_second_pass_steps: 20 // Additional steps for high-res refinement
  };

  // ... rest of the generation code ...
};

const updatePromptFromMetadata = (currentSeamlessType, currentPattern, customPrompt = '') => {
  const seamlessType = SEAMLESS_PATTERN_TYPES.find(t => t.id === currentSeamlessType) || SEAMLESS_PATTERN_TYPES[0];
  const basePrompt = seamlessType.prompt;

  const seamlessInstructions = {
    continuous: "perfect continuous flow across all edges with no visible seams, when tiled the pattern must appear as one single continuous design",
    mirrored: "perfect mirror symmetry at all edges with no visible seams, when tiled the pattern must appear as one single continuous design",
    rotational: "perfect 4-fold rotational symmetry with no visible seams, when tiled the pattern must appear as one single continuous design",
    halfdrop: "perfect half-drop repeat with no visible seams, when tiled the pattern must appear as one single continuous design",
    brick: "perfect brick repeat with no visible seams, when tiled the pattern must appear as one single continuous design",
    diamond: "perfect diamond grid with no visible seams, when tiled the pattern must appear as one single continuous design"
  };

  const additionalInstructions = seamlessInstructions[seamlessType.id] || seamlessInstructions.continuous;
  const pattern = currentPattern || DEFAULT_PATTERN;

  return `
    true seamless tileable pattern with perfect edge matching, when multiple tiles are placed side by side they must appear as one continuous design with absolutely no visible seams or joins,
    ${basePrompt},
    ${additionalInstructions},
    ${pattern.description},
    ${customPrompt},
    mathematically perfect edges, pixel-perfect alignment, absolutely no visible seams when tiled
  `.trim();
};

// ... rest of the code ... 