import type { TryOnStyle } from "../types"

// Style-specific technical directives
const STYLE_DIRECTIVES: Record<TryOnStyle, string> = {
  editorial:
    "Studio lighting (key light 45°, fill 1:2 ratio), f/2.8 depth, neutral backdrop, skin micro-texture retention, color-accurate rendering.",
  seda: "Specular highlights on silk/satin fabric, subsurface scattering for translucency, fluid draping physics, subtle wrinkle maps, reflection mapping.",
  justa:
    "Anatomical body conformity, stretch fabric tension, shadow occlusion for depth, muscle definition preservation, form-fitting deformation.",
  transparente:
    "Alpha channel blending for lace/sheer, skin visibility layer compositing, fabric micro-pattern detail, controlled opacity gradients.",
  casual:
    "Natural daylight HDRI (5500K), color vibrancy boost, relaxed pose dynamics, background bokeh (f/1.8 equivalent), lifestyle authenticity.",
  passarela:
    "Top-down key lighting (70° angle), high contrast ratio (8:1), dramatic shadow casting, garment-focused composition, editorial attitude.",
}

// Core VTO prompt template (v1)
const buildPromptV1 = (styleDirective: string): string => `
TASK: MANDATORY VIRTUAL TRY-ON SUBSTITUTION

INPUT IMAGES:
• IMAGE_A: Base human model (face, pose, background preserved)
• IMAGE_B: Target garment (complete transfer required)

REQUIRED OPERATIONS:

1. GARMENT MASKING & EXTRACTION
   - Segment target garment from IMAGE_B with edge precision
   - Generate alpha matte for clean isolation
   - Preserve all fabric details, textures, patterns

2. BODY REGION IDENTIFICATION
   - Detect original clothing area in IMAGE_A
   - Create accurate body mesh mapping
   - Define substitution boundaries (shoulders, waist, hemline)

3. GARMENT DEFORMATION & FITTING
   - Apply perspective-correct warping to match IMAGE_A viewpoint
   - Conform fabric to body shape using physics simulation
   - Generate realistic wrinkles, folds, tension points
   - Match body proportions (scale, rotation, position)

4. LIGHTING & MATERIAL INTEGRATION
   - Replicate lighting conditions from IMAGE_A onto garment
   - Match shadow direction, intensity, and softness
   - Apply correct material properties (diffuse, specular, roughness)
   - Blend fabric seamlessly with preserved skin/background

5. STRICT PRESERVATION
   - Face: UNCHANGED (features, expression, skin tone)
   - Hair: UNCHANGED (style, color, position)
   - Pose: UNCHANGED (limb positions, body angle)
   - Background: UNCHANGED (all elements behind subject)

6. STYLE APPLICATION
   ${styleDirective}

PROHIBITED ACTIONS:
✗ Layering garment over original clothing
✗ Showing IMAGE_B product as separate object
✗ Altering facial features or identity
✗ Changing background elements
✗ Adding text, watermarks, or UI elements
✗ Generating multiple clothing items

OUTPUT FORMAT:
Single photorealistic image, 1:1 aspect ratio, no metadata, no text.
`

// Prompt version registry
export const PROMPT_VERSIONS = {
  v1: (style: TryOnStyle) => buildPromptV1(STYLE_DIRECTIVES[style] || STYLE_DIRECTIVES.editorial),

  // Future versions:
  // v2: (style: TryOnStyle) => buildPromptV2(...),
  // v3: (style: TryOnStyle) => buildPromptV3(...),
}

// Get current active prompt
export const getCurrentPrompt = (style: TryOnStyle, version: keyof typeof PROMPT_VERSIONS = "v1"): string => {
  const promptBuilder = PROMPT_VERSIONS[version]
  if (!promptBuilder) {
    console.warn(`[PromptVersions] Version ${version} not found, falling back to v1`)
    return PROMPT_VERSIONS.v1(style)
  }
  return promptBuilder(style)
}
