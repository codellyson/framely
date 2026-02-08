import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimelineProvider, getCompositions } from '@codellyson/framely';
import { CompositionsView } from './CompositionsView';
import { getTemplateComponent } from './templates';
import './styles/design-system.css';
import './App.css';

/**
 * Render mode — bare composition at native resolution.
 * The renderer controls frames via window.__setFrame()
 */
function RenderView({ composition, inputProps = {} }) {
  const { component: Component, width, height, fps, durationInFrames, defaultProps } = composition;

  // Merge defaultProps with inputProps (inputProps take priority)
  const finalProps = { ...defaultProps, ...inputProps };

  return (
    <div
      id="render-container"
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <TimelineProvider
        fps={fps}
        width={width}
        height={height}
        durationInFrames={durationInFrames}
        renderMode={true}
      >
        <Component {...finalProps} />
      </TimelineProvider>
    </div>
  );
}

/**
 * Framely - Programmatic Video Framework
 *
 * Browse, preview, and render code-defined compositions.
 */
function App() {
  const params = new URLSearchParams(window.location.search);
  const renderMode = params.get('renderMode') === 'true';
  const initialCompositionId = params.get('composition') || null;

  // Parse props from URL for render mode
  const urlProps = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const propsParam = searchParams.get('props');
    if (propsParam) {
      try {
        return JSON.parse(decodeURIComponent(propsParam));
      } catch {
        return {};
      }
    }
    return {};
  }, []);

  const [selectedCompositionId, setSelectedCompositionId] = useState(initialCompositionId);
  const [templateCompositions, setTemplateCompositions] = useState({});

  // Load all code-defined compositions
  const codeCompositions = useMemo(() => {
    const map = getCompositions();
    const obj = {};
    for (const [id, comp] of map) {
      obj[id] = { ...comp };
    }
    return obj;
  }, []);

  // Merge code compositions with template compositions
  const compositions = useMemo(() => ({
    ...codeCompositions,
    ...templateCompositions,
  }), [codeCompositions, templateCompositions]);

  // Auto-select the first composition when none is selected or selection is invalid
  useEffect(() => {
    if (selectedCompositionId && compositions[selectedCompositionId]) return;
    const ids = Object.keys(compositions);
    if (ids.length > 0) {
      setSelectedCompositionId(ids[0]);
    }
  }, [compositions, selectedCompositionId]);

  // Handle using a template from the marketplace
  const handleUseTemplate = useCallback((template, customId, customProps) => {
    // Get the actual component from the template registry
    const component = getTemplateComponent(template.id);

    const newComposition = {
      id: customId,
      component: component,
      width: template.width,
      height: template.height,
      fps: template.fps,
      durationInFrames: template.durationInFrames,
      defaultProps: customProps || { ...template.defaultProps },
      folderPath: ['Templates'],
      _isTemplate: true,
      _templateId: template.id,
      _templateName: template.name,
    };

    setTemplateCompositions(prev => ({
      ...prev,
      [customId]: newComposition,
    }));

    // Select the newly added composition
    setSelectedCompositionId(customId);
  }, []);

  // Sync composition to URL
  useEffect(() => {
    if (renderMode) return;

    const url = new URL(window.location.href);
    if (selectedCompositionId) {
      url.searchParams.set('composition', selectedCompositionId);
    }
    window.history.replaceState({}, '', url);
  }, [selectedCompositionId, renderMode]);

  const composition = compositions[selectedCompositionId];

  // Render mode: bare composition at native resolution (for Playwright screenshots)
  if (renderMode) {
    // Check for template ID (used when rendering marketplace templates)
    const templateId = params.get('templateId');

    if (!composition) {
      // Try to load as a template for render mode
      // Use templateId if provided, otherwise try the composition ID
      const lookupId = templateId || selectedCompositionId;
      const templateComponent = getTemplateComponent(lookupId);
      if (templateComponent) {
        const templateComp = {
          id: selectedCompositionId,
          component: templateComponent,
          width: parseInt(params.get('width') || '1920', 10),
          height: parseInt(params.get('height') || '1080', 10),
          fps: parseInt(params.get('fps') || '30', 10),
          durationInFrames: parseInt(params.get('durationInFrames') || '150', 10),
          defaultProps: urlProps,
        };
        return <RenderView composition={templateComp} inputProps={urlProps} />;
      }
      return <div style={{ color: 'white', padding: 40 }}>Composition "{selectedCompositionId}" not found.</div>;
    }
    return <RenderView composition={composition} inputProps={urlProps} />;
  }

  // Studio mode: browse and preview compositions
  return (
    <div className="framely-editor">
      <header className="framely-header">
        <div className="framely-logo">
          <svg className="framely-logo-icon" width="28" height="28" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logo-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logo-bg)"/>
            <polygon points="12 8 24 16 12 24" fill="white"/>
          </svg>
          <span className="framely-logo-text">Framely</span>
        </div>
        <div className="framely-header-tagline">
          Programmatic Video Creation
        </div>
      </header>

      <CompositionsView
        compositions={compositions}
        selectedId={selectedCompositionId}
        onSelectComposition={setSelectedCompositionId}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}

export default App;
