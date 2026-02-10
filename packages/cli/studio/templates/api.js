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

  /**
   * Install a template package. Reads NDJSON progress stream.
   */
  async installTemplate(packageName, onEvent) {
    const response = await fetch(`${API_BASE_URL}/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: packageName }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Install failed' }));
      throw new Error(err.error || 'Install failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            if (onEvent) onEvent(event);
            if (event.type === 'error') throw new Error(event.message);
          } catch (e) {
            if (e.message !== line) throw e;
          }
        }
      }
    }
  },

  /**
   * Remove a template package. Reads NDJSON progress stream.
   */
  async removeTemplate(packageName, onEvent) {
    const response = await fetch(`${API_BASE_URL}/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: packageName }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Remove failed' }));
      throw new Error(err.error || 'Remove failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            if (onEvent) onEvent(event);
            if (event.type === 'error') throw new Error(event.message);
          } catch (e) {
            if (e.message !== line) throw e;
          }
        }
      }
    }
  },
};
