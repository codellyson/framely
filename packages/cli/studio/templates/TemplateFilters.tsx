import { useState, useEffect } from 'react';
import { templatesApi, CATEGORY_LABELS } from '@codellyson/framely';
import type { TemplateCategory, TemplatesFilterParams, CategoryCount } from '@codellyson/framely';

export interface TemplateFiltersProps {
  filters: TemplatesFilterParams;
  onChange: (filters: Partial<TemplatesFilterParams>) => void;
}

/**
 * Filter controls for the templates marketplace
 */
export function TemplateFilters({ filters, onChange }: TemplateFiltersProps) {
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  // Fetch categories on mount
  useEffect(() => {
    templatesApi.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChange({ search: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchValue, filters.search, onChange]);

  return (
    <div className="templates-filters">
      {/* Search */}
      <div className="filter-search">
        <svg
          className="filter-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="filter-categories">
        <button
          type="button"
          className={`filter-category ${!filters.category ? 'active' : ''}`}
          onClick={() => onChange({ category: undefined })}
        >
          All
        </button>
        {categories.map(({ category, count }) => (
          <button
            key={category}
            type="button"
            className={`filter-category ${filters.category === category ? 'active' : ''}`}
            onClick={() =>
              onChange({ category: filters.category === category ? undefined : category })
            }
          >
            {CATEGORY_LABELS[category as TemplateCategory] || category}
            <span className="filter-category-count">{count}</span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="filter-sort">
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) =>
            onChange({ sortBy: e.target.value as TemplatesFilterParams['sortBy'] })
          }
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>
    </div>
  );
}

export default TemplateFilters;
