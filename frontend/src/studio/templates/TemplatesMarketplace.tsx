import { useState, useEffect, useCallback } from 'react';
import { templatesApi } from '../../lib/templates/api';
import type { Template, TemplatesFilterParams } from '../../lib/templates/types';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';
import { UseTemplateDialog } from './UseTemplateDialog';
import './TemplatesMarketplace.css';

export interface TemplatesMarketplaceProps {
  onUseTemplate: (template: Template, customId: string, customProps?: Record<string, unknown>) => void;
}

/**
 * Main marketplace view for browsing templates
 */
export function TemplatesMarketplace({ onUseTemplate }: TemplatesMarketplaceProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TemplatesFilterParams>({
    sortBy: 'newest',
    page: 1,
    pageSize: 12,
  });
  const [hasMore, setHasMore] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [useDialogOpen, setUseDialogOpen] = useState(false);

  // Fetch templates
  const fetchTemplates = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await templatesApi.getTemplates(filters);
        setTemplates((prev) => (reset ? response.templates : [...prev, ...response.templates]));
        setHasMore(response.hasMore);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Fetch on filter change
  useEffect(() => {
    fetchTemplates(true);
  }, [filters.category, filters.search, filters.sortBy]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<TemplatesFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  // Handle template click
  const handleTemplateClick = useCallback((template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  }, []);

  // Handle "Use Template" from preview
  const handleUseFromPreview = useCallback(() => {
    setPreviewOpen(false);
    setUseDialogOpen(true);
  }, []);

  // Confirm using template
  const handleConfirmUse = useCallback(
    (customId: string, customProps: Record<string, unknown>) => {
      if (selectedTemplate) {
        onUseTemplate(selectedTemplate, customId, customProps);
        setUseDialogOpen(false);
        setSelectedTemplate(null);
      }
    },
    [selectedTemplate, onUseTemplate]
  );

  // Load more templates
  const handleLoadMore = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
  }, []);

  // Load more when page changes
  useEffect(() => {
    if (filters.page && filters.page > 1) {
      fetchTemplates(false);
    }
  }, [filters.page]);

  return (
    <div className="templates-marketplace">
      {/* Header */}
      <div className="templates-header">
        <h2>Templates Marketplace</h2>
        <p className="templates-subtitle">
          Browse and use professionally designed video templates
        </p>
      </div>

      {/* Filters */}
      <TemplateFilters filters={filters} onChange={handleFilterChange} />

      {/* Content */}
      {error ? (
        <div className="templates-error">
          <p>{error}</p>
          <button type="button" onClick={() => fetchTemplates(true)}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="templates-grid">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="template-card-skeleton" />
              ))}
          </div>

          {!loading && templates.length === 0 && (
            <div className="templates-empty">
              <p>No templates found</p>
              {filters.search && (
                <p className="templates-empty-hint">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}

          {hasMore && !loading && (
            <div className="templates-load-more">
              <button type="button" onClick={handleLoadMore}>
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        open={previewOpen}
        template={selectedTemplate}
        onClose={() => setPreviewOpen(false)}
        onUseTemplate={handleUseFromPreview}
      />

      {/* Use Template Dialog */}
      <UseTemplateDialog
        open={useDialogOpen}
        template={selectedTemplate}
        onClose={() => setUseDialogOpen(false)}
        onConfirm={handleConfirmUse}
      />
    </div>
  );
}

export default TemplatesMarketplace;
