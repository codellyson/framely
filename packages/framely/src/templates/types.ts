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
  id: string;
  name: string;
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
  /** Remote bundle URL for the component */
  bundleUrl: string;
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
  /** Downloads count */
  downloads?: number;
  /** Average rating (1-5) */
  rating?: number;
  /** Featured flag */
  featured?: boolean;
  /** Creation date */
  createdAt: string;
  /** Last update date */
  updatedAt: string;
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
