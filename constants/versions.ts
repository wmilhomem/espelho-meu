// Pipeline and prompt versioning constants

export const CURRENT_PROMPT_VERSION = "v1"
export const CURRENT_PIPELINE_VERSION = "v1.0"

// Prompt version history (for rollbacks and A/B testing)
export const PROMPT_VERSIONS = {
  v1: {
    description: "Technical VTO prompt with masking, warping, and lighting directives",
    createdAt: "2025-01-15",
    deprecated: false,
    features: ["garment_masking", "physics_simulation", "lighting_matching", "style_presets"],
  },
  // Future versions can be added here
  // "v1.1": {
  //   description: "Improved fabric physics instructions",
  //   createdAt: "2025-02-01",
  //   deprecated: false,
  // },
} as const

// Pipeline version history
export const PIPELINE_VERSIONS = {
  "v1.0": {
    description: "Standard pipeline: resize -> base64 -> API call -> upload",
    createdAt: "2025-01-15",
    deprecated: false,
    features: ["image_resize_800x800", "jpeg_compression_80", "gemini_api"],
  },
  // Future versions can be added here
  // "v2.0": {
  //   description: "Optimized pipeline with CDN caching",
  //   createdAt: "2025-03-01",
  //   deprecated: false,
  //   features: ["image_resize_1024x1024", "webp_compression_85", "gemini_api", "cdn_cache"],
  // },
} as const

export type PromptVersion = keyof typeof PROMPT_VERSIONS
export type PipelineVersion = keyof typeof PIPELINE_VERSIONS
