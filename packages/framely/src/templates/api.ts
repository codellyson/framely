import type {
  Template,
  TemplatesListResponse,
  TemplatesFilterParams,
  CategoryCount,
} from './types';
import { MOCK_TEMPLATES } from './mockData';

/**
 * API base URL - can be overridden via environment variable
 */
const API_BASE_URL = '/api/templates';

/**
 * Check if we should use mock data (for development without backend)
 */
const USE_MOCK = true; // Set to false when backend is available

/**
 * Templates API service
 * Designed to easily switch between mock data and real backend
 */
export const templatesApi = {
  /**
   * Fetch templates with optional filters
   */
  async getTemplates(params?: TemplatesFilterParams): Promise<TemplatesListResponse> {
    if (USE_MOCK) {
      return getMockTemplates(params);
    }

    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const response = await fetch(`${API_BASE_URL}?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    return response.json();
  },

  /**
   * Fetch single template by ID
   */
  async getTemplate(id: string): Promise<Template> {
    if (USE_MOCK) {
      const template = MOCK_TEMPLATES.find((t) => t.id === id);
      if (!template) {
        throw new Error('Template not found');
      }
      return template;
    }

    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error('Template not found');
    }
    return response.json();
  },

  /**
   * Fetch template categories with counts
   */
  async getCategories(): Promise<CategoryCount[]> {
    if (USE_MOCK) {
      return getMockCategories();
    }

    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  /**
   * Load template component bundle from CDN
   * Note: This is a placeholder - actual implementation depends on how bundles are hosted
   */
  async loadTemplateBundle(
    _bundleUrl: string
  ): Promise<React.ComponentType<Record<string, unknown>>> {
    // In production, this would dynamically import the remote bundle
    // For now, return a placeholder component
    console.warn('Template bundle loading not yet implemented');
    return () => null;
  },
};

/**
 * Mock implementation of getTemplates with filtering
 */
function getMockTemplates(params?: TemplatesFilterParams): TemplatesListResponse {
  let filtered = [...MOCK_TEMPLATES];

  // Filter by category
  if (params?.category) {
    filtered = filtered.filter((t) => t.category === params.category);
  }

  // Filter by search
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  // Filter by featured
  if (params?.featured) {
    filtered = filtered.filter((t) => t.featured);
  }

  // Sort
  switch (params?.sortBy) {
    case 'popular':
      filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      break;
    case 'rating':
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'newest':
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  // Pagination
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 12;
  const start = (page - 1) * pageSize;
  const templates = filtered.slice(start, start + pageSize);

  return {
    templates,
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
  };
}

/**
 * Mock implementation of getCategories
 */
function getMockCategories(): CategoryCount[] {
  const counts: Record<string, number> = {};
  MOCK_TEMPLATES.forEach((t) => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return Object.entries(counts).map(([category, count]) => ({
    category: category as CategoryCount['category'],
    count,
  }));
}

export default templatesApi;
