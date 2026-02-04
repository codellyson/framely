/**
 * AssetPanel Component
 *
 * File browser for project static assets (public/ directory).
 * Shows thumbnails for images/videos, and allows copying staticFile() code.
 */

import { useState, useEffect, useCallback, useMemo, type MouseEvent as ReactMouseEvent, type ChangeEvent } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Asset {
  /** File name (e.g. "logo.png") */
  name: string;
  /** Relative path from public directory (e.g. "images/logo.png") */
  path: string;
  /** Asset category type (image, video, audio, font, data, other) */
  type: string;
  /** File size in bytes */
  size: number;
  /** File extension including dot (e.g. ".png") */
  extension: string;
}

export interface AssetPanelProps {
  /** Render API base URL (defaults to VITE_RENDER_API_PORT or localhost:3001) */
  apiUrl?: string;
  /** Callback when user wants to add an asset to the timeline */
  onAssetAdd?: (asset: Asset) => void;
}

interface AssetsApiResponse {
  assets: Asset[];
}

type AssetType = 'image' | 'video' | 'audio' | 'font' | 'data' | 'other';

// ─── Constants ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<AssetType | string, string> = {
  image: '\uD83D\uDDBC\uFE0F',
  video: '\uD83C\uDFAC',
  audio: '\uD83C\uDFB5',
  font: '\uD83D\uDD24',
  data: '\uD83D\uDCC4',
  other: '\uD83D\uDCC1',
};

/**
 * Format bytes to human readable string.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * AssetPanel component.
 */
export function AssetPanel({ apiUrl, onAssetAdd }: AssetPanelProps): JSX.Element {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Determine API URL — use relative path by default so Vite's middleware handles it
  const baseUrl = useMemo<string>(() => {
    if (apiUrl) return apiUrl;
    return '';
  }, [apiUrl]);

  // Fetch assets
  const fetchAssets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res: Response = await fetch(`${baseUrl}/api/assets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AssetsApiResponse = await res.json();
      setAssets(data.assets || []);
    } catch (err: unknown) {
      const message: string = err instanceof Error ? err.message : String(err);
      setError(message);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Filter assets
  const filteredAssets = useMemo<Asset[]>(() => {
    let result: Asset[] = assets;
    if (typeFilter !== 'all') {
      result = result.filter((a: Asset) => a.type === typeFilter);
    }
    if (filter.trim()) {
      const q: string = filter.toLowerCase();
      result = result.filter((a: Asset) => a.name.toLowerCase().includes(q));
    }
    return result;
  }, [assets, typeFilter, filter]);

  // Available types for filter
  const availableTypes = useMemo<string[]>(() => {
    const types = new Set<string>(assets.map((a: Asset) => a.type));
    return ['all', ...Array.from(types).sort()];
  }, [assets]);

  // Copy staticFile() code
  const handleCopy = useCallback((assetPath: string): void => {
    const code: string = `staticFile('${assetPath}')`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedPath(assetPath);
      setTimeout(() => setCopiedPath(null), 2000);
    });
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          backgroundColor: '#252525',
        }}
      >
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}>Assets</span>
        <button
          onClick={fetchAssets}
          aria-label="Refresh assets"
          title="Refresh"
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '2px 6px',
          }}
        >
          {'\u21BB'}
        </button>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={filter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
          placeholder="Search files..."
          aria-label="Search assets"
          style={{
            flex: 1,
            padding: '5px 8px',
            backgroundColor: '#333',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            outline: 'none',
          }}
        />
        <select
          value={typeFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
          aria-label="Filter by type"
          style={{
            padding: '5px 8px',
            backgroundColor: '#333',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {availableTypes.map((t: string) => (
            <option key={t} value={t}>
              {t === 'all' ? 'All types' : t}
            </option>
          ))}
        </select>
      </div>

      {/* Asset list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
        {loading && (
          <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            Loading assets...
          </div>
        )}

        {error && (
          <div style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            Failed to load: {error}
            <br />
            <button
              onClick={fetchAssets}
              style={{
                marginTop: '8px',
                background: 'none',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#aaa',
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredAssets.length === 0 && (
          <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            {assets.length === 0 ? 'No assets in public/ directory' : 'No matching assets'}
          </div>
        )}

        {filteredAssets.map((asset: Asset) => (
          <div
            key={asset.path}
            onClick={() => handleCopy(asset.path)}
            title={`Click to copy: staticFile('${asset.path}')`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.15s',
              backgroundColor: copiedPath === asset.path ? 'rgba(16,185,129,0.15)' : 'transparent',
            }}
            onMouseEnter={(e: ReactMouseEvent<HTMLDivElement>) => {
              if (copiedPath !== asset.path) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
              }
            }}
            onMouseLeave={(e: ReactMouseEvent<HTMLDivElement>) => {
              if (copiedPath !== asset.path) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* Thumbnail or icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '4px',
                backgroundColor: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '16px',
                overflow: 'hidden',
              }}
            >
              {asset.type === 'image' ? (
                <img
                  src={`/${asset.path}`}
                  alt={asset.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = 'none';
                    const sibling = e.currentTarget.nextSibling as HTMLElement | null;
                    if (sibling) {
                      sibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <span
                style={{
                  display: asset.type === 'image' ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
              >
                {TYPE_ICONS[asset.type] || TYPE_ICONS.other}
              </span>
            </div>

            {/* File info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#ddd',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {asset.name}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                {formatSize(asset.size)} · {asset.extension.replace('.', '').toUpperCase()}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
              {onAssetAdd && (asset.type === 'audio' || asset.type === 'video' || asset.type === 'image') && (
                <button
                  onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onAssetAdd(asset);
                  }}
                  title="Add to timeline"
                  style={{
                    background: 'rgba(59,130,246,0.2)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: '3px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '10px',
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Timeline
                </button>
              )}
              <span style={{ fontSize: '10px', color: copiedPath === asset.path ? '#10b981' : '#555' }}>
                {copiedPath === asset.path ? 'Copied!' : 'Copy'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid #333',
          backgroundColor: '#222',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        {assets.length} file{assets.length !== 1 ? 's' : ''} in public/
      </div>
    </div>
  );
}

export default AssetPanel;
