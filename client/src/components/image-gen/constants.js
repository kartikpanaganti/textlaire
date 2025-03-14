export const DEFAULT_PROMPT = "Ultra high-resolution seamless tileable textile pattern design, perfectly repeating in all directions, symmetrical and continuous pattern for luxury towel fabric";

// Enhanced design patterns with more specific descriptions
export const DESIGN_PATTERNS = [
  { id: "floral-victorian", name: "Floral Victorian", description: "Elegant Victorian-era floral patterns with intricate details and classical motifs" },
  { id: "modern-geometric", name: "Modern Geometric", description: "Contemporary geometric shapes with clean lines and bold patterns" },
  { id: "classic-baroque", name: "Classic Baroque", description: "Ornate baroque patterns with rich details and flowing curves" },
  { id: "minimalist", name: "Minimalist Lines", description: "Clean, simple lines with modern minimalist aesthetic" },
  { id: "mediterranean", name: "Mediterranean Tiles", description: "Colorful Mediterranean-inspired tile patterns" },
  { id: "oriental-mandala", name: "Oriental Mandala", description: "Intricate mandala designs with symmetrical patterns" },
  { id: "art-deco", name: "Art Deco", description: "Sophisticated Art Deco patterns with geometric elegance" },
  { id: "tropical", name: "Tropical Leaves", description: "Lush tropical foliage patterns" },
  { id: "damask", name: "Damask Pattern", description: "Traditional damask patterns with elegant symmetry" },
  { id: "celtic", name: "Celtic Knots", description: "Intricate Celtic knot patterns with continuous weaving" }
];

// Enhanced design styles with specific techniques
export const DESIGN_STYLES = [
  { id: "embroidered", name: "Embroidered", technique: "Detailed embroidery texture with raised elements" },
  { id: "jacquard", name: "Jacquard Woven", technique: "Complex woven patterns with multi-threaded details" },
  { id: "dobby", name: "Dobby Border", technique: "Textured border designs with geometric elements" },
  { id: "textured", name: "Textured Relief", technique: "3D textural elements with depth and shadow" },
  { id: "raised", name: "Raised Pattern", technique: "Elevated design elements with dimensional effect" },
  { id: "tone", name: "Tone-on-tone", technique: "Delicate monochromatic patterns with subtle contrast" },
  { id: "lace", name: "Lace-like", technique: "Delicate lace-inspired patterns with fine details" },
  { id: "contemporary", name: "Contemporary", technique: "Strong modern patterns with bold contrasts" },
  { id: "filigree", name: "Filigree", technique: "Fine, intricate scrollwork patterns" },
  { id: "classic", name: "Classic Border", technique: "Traditional border patterns with refined details" },
  { id: "terry", name: "Terry Cloth", technique: "Soft looped pile texture typical of towels" },
  { id: "velour", name: "Velour", technique: "Plush velvet-like surface with sheared loops" },
  { id: "waffle", name: "Waffle Weave", technique: "Textured honeycomb or grid pattern" },
  { id: "flat-woven", name: "Flat Woven", technique: "Smooth flat surface without loops" },
  { id: "printed", name: "Digital Print", technique: "Vibrant digitally printed design on fabric surface" }
];

export const DESIGN_ELEMENTS = [
  "Roses and Vines",
  "Geometric Shapes",
  "Paisley Motifs",
  "Greek Key Pattern",
  "Fleur-de-lis",
  "Abstract Waves",
  "Botanical Leaves",
  "Arabesque Patterns",
  "Chevron Stripes",
  "Medallion Centers"
];

// Add personalization options
export const PERSONALIZATION_OPTIONS = [
  "Monogram",
  "Custom Text",
  "Name",
  "Initial",
  "Date",
  "Custom Logo",
  "None"
];

export const TEXT_PLACEMENT_OPTIONS = [
  "Corner",
  "Center",
  "Border",
  "Scattered"
];

// Add sample patterns
export const SAMPLE_PATTERNS = [
  { id: "roses", name: "Roses", prompt: "beautiful blooming roses with detailed petals and leaves, textile pattern" },
  { id: "sun-moon", name: "Sun & Moon", prompt: "celestial pattern with intricate sun and moon motifs, textile design" },
  { id: "phoenix", name: "Phoenix", prompt: "majestic phoenix with flowing feathers and flames, textile pattern" },
  { id: "dragons", name: "Dragons", prompt: "mythical dragons with scales and oriental design, textile pattern" },
  { id: "butterflies", name: "Butterflies", prompt: "delicate butterflies with detailed wings, textile pattern" },
  { id: "waves", name: "Ocean Waves", prompt: "flowing ocean waves with foam and ripples, textile pattern" },
  { id: "peacock", name: "Peacock", prompt: "elegant peacock feathers with iridescent details, textile pattern" },
  { id: "lotus", name: "Lotus", prompt: "sacred lotus flowers with spiritual motifs, textile pattern" },
  { id: "constellation", name: "Constellations", prompt: "night sky with stars and constellation patterns, textile pattern" },
  { id: "cherry-blossom", name: "Cherry Blossoms", prompt: "delicate cherry blossoms with falling petals, textile pattern" },
  { id: "geometric", name: "Geometric", prompt: "precise geometric shapes with clean lines and symmetry, textile pattern" },
  { id: "abstract", name: "Abstract", prompt: "flowing abstract shapes with organic forms, textile pattern" },
  { id: "tribal", name: "Tribal", prompt: "traditional tribal patterns with cultural motifs, textile pattern" },
  { id: "paisley", name: "Paisley", prompt: "elegant paisley teardrop patterns with intricate details, textile pattern" },
  { id: "damask", name: "Damask", prompt: "luxurious damask patterns with symmetrical ornate designs, textile pattern" },
  { id: "stripes", name: "Stripes", prompt: "elegant striped pattern with varying widths and textures, textile pattern" },
  { id: "polka-dots", name: "Polka Dots", prompt: "playful polka dot pattern with varying sizes, textile pattern" },
  { id: "herringbone", name: "Herringbone", prompt: "classic herringbone zigzag pattern, textile design" },
  { id: "chevron", name: "Chevron", prompt: "bold chevron zigzag pattern with clean lines, textile design" },
  { id: "custom", name: "Custom Design", prompt: "custom textile pattern" }
];

// Add seamless pattern types with specific descriptions
export const SEAMLESS_PATTERN_TYPES = [
  { id: "continuous", name: "Continuous Flow", description: "Smooth flowing pattern with no visible edges" },
  { id: "mirrored", name: "Mirrored", description: "Pattern mirrors at edges for perfect symmetry" },
  { id: "rotational", name: "Rotational", description: "Pattern rotates around central point" },
  { id: "half-drop", name: "Half-Drop", description: "Pattern repeats with vertical offset" },
  { id: "brick", name: "Brick", description: "Pattern repeats in brick-like arrangement" },
  { id: "diamond", name: "Diamond Grid", description: "Pattern arranged in diamond grid" }
];

export const INPUT_DEFAULTS = {
  _force_msgpack: new Uint8Array([]),
  enable_safety_checker: true,
  image_size: "square_hd",
  sync_mode: true,
  num_images: 1,
  num_inference_steps: "2",
};

// Towel product types for dropdown selection
export const TOWEL_TYPES = [
  "Bath Towel",
  "Hand Towel",
  "Face Towel",
  "Beach Towel",
  "Kitchen Towel",
  "Sports Towel",
  "Decorative Towel"
];

// Towel materials for dropdown selection
export const TOWEL_MATERIALS = [
  "100% Cotton",
  "Egyptian Cotton",
  "Microfiber",
  "Bamboo",
  "Turkish Cotton",
  "Linen Blend",
  "Cotton-Polyester Blend"
];

// Towel colors for dropdown selection
export const TOWEL_COLORS = [
  { id: "white", name: "White", description: "Pure white color scheme" },
  { id: "beige", name: "Beige", description: "Soft beige color scheme" },
  { id: "gray", name: "Gray", description: "Neutral gray color scheme" },
  { id: "navy-blue", name: "Navy Blue", description: "Deep navy blue color scheme" },
  { id: "light-blue", name: "Light Blue", description: "Light and airy blue color scheme" },
  { id: "pink", name: "Pink", description: "Soft pink color scheme" },
  { id: "green", name: "Green", description: "Vibrant green color scheme" },
  { id: "yellow", name: "Yellow", description: "Bright yellow color scheme" },
  { id: "red", name: "Red", description: "Vivid red color scheme" },
  { id: "black", name: "Black", description: "Rich black color scheme" },
  { id: "purple", name: "Purple", description: "Elegant purple color scheme" },
  { id: "multicolor", name: "Multicolor", description: "Bold multicolor scheme" }
];

// Add textile industry-specific applications
export const TOWEL_APPLICATIONS = [
  "Luxury Hotel Collection",
  "Spa & Wellness",
  "Beach Resort",
  "Home Collection",
  "Athletic & Sports",
  "Kitchen & Dining",
  "Bath Essentials",
  "Promotional & Corporate",
  "Seasonal Collection",
  "Children's Collection"
];

// Add textile-specific finishes
export const TEXTILE_FINISHES = [
  "Ultra Absorbent",
  "Quick Dry",
  "Anti-Microbial",
  "Eco-Friendly",
  "Hypoallergenic",
  "Fade Resistant",
  "Soft Touch",
  "Luxury Plush",
  "Lightweight",
  "Heavy Duty"
]; 