import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimelineProvider } from './lib';
import { getCompositions } from './lib/registerRoot';
import { CompositionsView } from './studio/CompositionsView';
import { getTemplateComponent } from './templates';
import { HomePage, DocsPage } from './pages';
import './styles/design-system.css';
import './App.css';

/**
 * Framely - Programmatic Video Framework
 *
 * Browse, preview, and render code-defined compositions.
 */
function App() {
  const params = new URLSearchParams(window.location.search);
  const renderMode = params.get('renderMode') === 'true';
  const initialCompositionId = params.get('composition') || 'sample-video';

  // Simple hash-based routing
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash.slice(1);
    if (hash === 'docs') return 'docs';
    if (hash === 'studio') return 'studio';
    if (hash === '' || hash === 'home') return 'home';
    return 'home';
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'docs') setCurrentPage('docs');
      else if (hash === 'studio') setCurrentPage('studio');
      else if (hash === '' || hash === 'home') setCurrentPage('home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation function
  const navigate = useCallback((page) => {
    if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = page;
    }
    setCurrentPage(page);
  }, []);

  // Parse props from URL for render mode
  const urlProps = useMemo(() => {
    const propsParam = params.get('props');
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

  // Sync composition to URL (only in studio mode)
  useEffect(() => {
    if (renderMode || currentPage !== 'studio') return;

    const url = new URL(window.location.href);
    if (selectedCompositionId) {
      url.searchParams.set('composition', selectedCompositionId);
    }
    window.history.replaceState({}, '', url);
  }, [selectedCompositionId, renderMode, currentPage]);

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

  // Homepage
  if (currentPage === 'home') {
    return <HomePage onNavigate={navigate} />;
  }

  // Documentation
  if (currentPage === 'docs') {
    return <DocsPage onNavigate={navigate} />;
  }

  // Studio mode: browse and preview compositions
  return (
    <div className="framely-editor">
      <header className="framely-header">
        <div className="framely-logo" onClick={() => navigate('home')} style={{ cursor: 'pointer' }}>
          <span className="framely-logo-icon">▶</span>
          <span className="framely-logo-text">Framely</span>
        </div>
        <div className="framely-header-tagline">
          Programmatic Video Creation
        </div>
        <div className="framely-header-actions">
          <button
            className="framely-nav-btn"
            onClick={() => navigate('docs')}
          >
            Docs
          </button>
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

export default App;
