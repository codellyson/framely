/**
 * Templates API client
 *
 * Fetches from the CLI's own /api/templates endpoints served by the preview server.
 */

const API_BASE_URL = '/api/templates';

export const templatesApi = {
  async getTemplates(params) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));

    const response = await fetch(`${API_BASE_URL}?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  async getTemplate(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error('Template not found');
    return response.json();
  },

  async getCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },
};
