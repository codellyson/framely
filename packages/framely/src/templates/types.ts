/**
 * Template types for the Framely Templates Marketplace
 */

/**
 * Template category for filtering
 */
export type TemplateCategory =
  | 'social-media'
  | 'marketing'
  | 'presentation'
  | 'intro-outro'
  | 'lower-thirds'
  | 'text-animations'
  | 'backgrounds';

/**
 * Template author information
 */
export interface TemplateAuthor {
  name: string;
  github?: string;
  avatar?: string;
  verified?: boolean;
}

/**
 * Template preview assets
 */
export interface TemplatePreview {
  /** Static thumbnail image URL */
  thumbnail: string;
  /** Animated preview GIF/WebM URL */
  preview?: string;
  /** Video preview URL (for modal) */
  video?: string;
}

/**
 * Template metadata
 */
export interface Template {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template description */
  description: string;
  /** Category for filtering */
  category: TemplateCategory;
  /** Tags for search */
  tags: string[];
  /** Preview assets */
  preview: TemplatePreview;
  /** Template author */
  author: TemplateAuthor;
  /** Registry directory name */
  registryDir?: string;
  /** Source files to copy */
  files?: string[];
  /** Template version */
  version: string;
  /** Video width */
  width: number;
  /** Video height */
  height: number;
  /** Frames per second */
  fps: number;
  /** Total duration in frames */
  durationInFrames: number;
  /** Default props for the template */
  defaultProps: Record<string, unknown>;
  /** Whether this template is installed locally */
  installed?: boolean;
  /** Installed version (may differ from registry version) */
  installedVersion?: string;
  /** Downloads count */
  downloads?: number;
  /** Average rating (1-5) */
  rating?: number;
  /** Featured flag */
  featured?: boolean;
  /** Creation date */
  createdAt?: string;
  /** Last update date */
  updatedAt?: string;
}

/**
 * Metadata stored in a template's framely-template.json
 */
export interface TemplatePackageMeta {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  preview: TemplatePreview;
  author: TemplateAuthor;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps: Record<string, unknown>;
}

/**
 * A template entry in the GitHub registry
 */
export interface RegistryTemplate extends Template {
  /** Directory name in the registry baseUrl */
  registryDir: string;
  /** Source files to copy into the project */
  files: string[];
}

/**
 * Shape of the GitHub-hosted registry.json
 */
export interface RegistrySchema {
  version: number;
  /** Base URL for fetching template source files */
  baseUrl: string;
  templates: RegistryTemplate[];
}

/**
 * API response for templates list
 */
export interface TemplatesListResponse {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * API request filters for templates
 */
export interface TemplatesFilterParams {
  category?: TemplateCategory;
  search?: string;
  tags?: string[];
  featured?: boolean;
  sortBy?: 'newest' | 'popular' | 'rating';
  page?: number;
  pageSize?: number;
}

/**
 * Category with count for filter display
 */
export interface CategoryCount {
  category: TemplateCategory;
  count: number;
}

/**
 * Category display labels
 */
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  'social-media': 'Social Media',
  'marketing': 'Marketing',
  'presentation': 'Presentation',
  'intro-outro': 'Intro/Outro',
  'lower-thirds': 'Lower Thirds',
  'text-animations': 'Text Animations',
  'backgrounds': 'Backgrounds',
};
