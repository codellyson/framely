# framely preview

Starts the studio dev server for previewing your compositions in the browser.

## Usage

```bash
npx framely preview [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port <number>` | Dev server port | 3000 |
| `--no-open` | Don't open browser automatically | — |

## How It Works

The preview command:

1. Finds your entry file (`src/index.jsx` or `src/index.tsx`)
2. Starts a Vite dev server that combines your compositions with the studio UI
3. Starts the render API on port+1 for rendering from the studio
4. Opens your browser to the studio

The studio provides:
- **Sidebar**: Browse and select compositions
- **Player**: Live preview with playback controls
- **Timeline**: Scrub through frames, view sequences
- **Props Editor**: Edit composition props in real-time
- **Render Dialog**: Render to video with codec/quality settings
