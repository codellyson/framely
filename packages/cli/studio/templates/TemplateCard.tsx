import type { Template } from '@codellyson/framely';

export interface TemplateCardProps {
  template: Template;
  onClick: () => void;
}

/**
 * Template card component for the marketplace grid
 */
export function TemplateCard({ template, onClick }: TemplateCardProps) {
  return (
    <button className="template-card" onClick={onClick} type="button">
      <div className="template-card-preview">
        <img
          src={template.preview.thumbnail}
          alt={template.name}
          loading="lazy"
        />
        {template.installed && (
          <span className="template-card-badge template-card-badge--installed">Installed</span>
        )}
        {template.featured && !template.installed && (
          <span className="template-card-badge">Featured</span>
        )}
      </div>
      <div className="template-card-info">
        <h3 className="template-card-name">{template.name}</h3>
        <p className="template-card-meta">
          {template.width}x{template.height} &bull; {template.fps}fps
        </p>
        <div className="template-card-footer">
          <span className="template-card-author">
            {template.author.verified && (
              <svg
                className="template-verified-icon"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
            {template.author.name}
          </span>
          {template.rating && (
            <span className="template-card-rating">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {template.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default TemplateCard;
