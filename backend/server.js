import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderComposition, renderStill, renderParallel } from './renderer.js';
import { listCodecs } from './codecs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve rendered videos for download
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

/**
 * POST /api/render
 *
 * Render a composition to video with various codec and quality options.
 *
 * Body:
 *   compositionId: string (required)
 *   width: number (default: 1920)
 *   height: number (default: 1080)
 *   fps: number (default: 30)
 *   durationInFrames: number (default: 300)
 *   startFrame: number (default: 0)
 *   endFrame: number (default: durationInFrames - 1)
 *   codec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores' | 'gif' (default: 'h264')
 *   crf: number (default: 18)
 *   bitrate: string (optional, e.g., '5M')
 *   scale: number (default: 1)
 *   inputProps: object (default: {})
 *   muted: boolean (default: false)
 *   imageSequence: boolean (default: false)
 *   imageFormat: 'png' | 'jpeg' (default: 'png')
 *   imageQuality: number (default: 80)
 *   parallel: boolean (default: false)
 *   concurrency: number (default: 4)
 *   frontendUrl: string (default: http://localhost:3000)
 *
 * Returns:
 *   { outputPath, downloadUrl, durationMs, codec, totalFrames }
 */
app.post('/api/render', async (req, res) => {
  const {
    compositionId,
    width = 1920,
    height = 1080,
    fps = 30,
    durationInFrames = 300,
    startFrame = 0,
    endFrame,
    codec = 'h264',
    crf = 18,
    bitrate,
    scale = 1,
    inputProps = {},
    muted = false,
    imageSequence = false,
    imageFormat = 'png',
    imageQuality = 80,
    parallel = false,
    concurrency = 4,
    frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000',
  } = req.body;

  if (!compositionId) {
    return res.status(400).json({ error: 'compositionId is required' });
  }

  const actualEndFrame = endFrame ?? durationInFrames - 1;
  const totalFrames = actualEndFrame - startFrame + 1;

  console.log(`\n🎬 Starting render: ${compositionId}`);
  console.log(`   ${width}x${height} @ ${fps}fps, ${totalFrames} frames`);
  console.log(`   Codec: ${codec}, CRF: ${crf}${bitrate ? `, Bitrate: ${bitrate}` : ''}`);
  if (parallel) {
    console.log(`   Mode: Parallel (${concurrency} workers)`);
  }

  const startTime = Date.now();

  try {
    const renderOptions = {
      compositionId,
      width,
      height,
      fps,
      durationInFrames,
      startFrame,
      endFrame: actualEndFrame,
      codec,
      crf,
      bitrate,
      scale,
      inputProps,
      muted,
      imageSequence,
      imageFormat,
      imageQuality,
      frontendUrl,
      outputDir: path.join(__dirname, 'outputs'),
      onProgress: (frame, total) => {
        const pct = ((frame / total) * 100).toFixed(1);
        process.stdout.write(`\r   Rendering: frame ${frame}/${total} (${pct}%)`);
      },
    };

    let outputPath;
    if (parallel && !imageSequence) {
      outputPath = await renderParallel({
        ...renderOptions,
        concurrency,
      });
    } else {
      outputPath = await renderComposition(renderOptions);
    }

    const durationMs = Date.now() - startTime;
    const outputFilename = path.basename(outputPath);

    console.log(`\n✅ Render complete in ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`   Output: ${outputPath}`);

    res.json({
      outputPath,
      downloadUrl: imageSequence
        ? `Directory: ${outputPath}`
        : `http://localhost:${PORT}/outputs/${outputFilename}`,
      durationMs,
      codec,
      totalFrames,
    });
  } catch (err) {
    console.error('\n❌ Render failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/still
 *
 * Render a single frame as an image.
 *
 * Body:
 *   compositionId: string (required)
 *   frame: number (default: 0)
 *   width: number (default: 1920)
 *   height: number (default: 1080)
 *   format: 'png' | 'jpeg' (default: 'png')
 *   quality: number (default: 80)
 *   scale: number (default: 1)
 *   inputProps: object (default: {})
 *   frontendUrl: string (default: http://localhost:3000)
 *
 * Returns:
 *   { outputPath, downloadUrl, durationMs }
 */
app.post('/api/still', async (req, res) => {
  const {
    compositionId,
    frame = 0,
    width = 1920,
    height = 1080,
    format = 'png',
    quality = 80,
    scale = 1,
    inputProps = {},
    frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000',
  } = req.body;

  if (!compositionId) {
    return res.status(400).json({ error: 'compositionId is required' });
  }

  console.log(`\n📸 Capturing still: ${compositionId} (frame ${frame})`);
  console.log(`   ${width}x${height}, format: ${format}`);

  const startTime = Date.now();

  try {
    const outputPath = await renderStill({
      compositionId,
      frame,
      width,
      height,
      format,
      quality,
      scale,
      inputProps,
      frontendUrl,
      outputDir: path.join(__dirname, 'outputs'),
    });

    const durationMs = Date.now() - startTime;
    const outputFilename = path.basename(outputPath);

    console.log(`✅ Still captured in ${(durationMs / 1000).toFixed(1)}s`);
    console.log(`   Output: ${outputPath}`);

    res.json({
      outputPath,
      downloadUrl: `http://localhost:${PORT}/outputs/${outputFilename}`,
      durationMs,
    });
  } catch (err) {
    console.error('❌ Still capture failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/codecs
 *
 * Returns the list of available codecs.
 */
app.get('/api/codecs', (req, res) => {
  res.json({ codecs: listCodecs() });
});

/**
 * GET /api/compositions
 *
 * Returns the list of available compositions.
 * In a real setup, this would query the frontend registry.
 */
app.get('/api/compositions', (req, res) => {
  res.json({
    compositions: [
      {
        id: 'sample-video',
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 300,
      },
    ],
  });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Framely Render Server running on http://localhost:${PORT}`);
  console.log(`\n   Endpoints:`);
  console.log(`   POST /api/render  - Render video`);
  console.log(`   POST /api/still   - Capture single frame`);
  console.log(`   GET  /api/codecs  - List available codecs`);
  console.log(`   GET  /api/compositions - List compositions\n`);
});
