# framely batch

Renders multiple videos from a data file. Each row in the data file becomes the props for one video render — enabling data-driven video generation at scale.

## Usage

```bash
npx framely batch <composition-id> --data <file> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--data <path>` | Path to CSV or JSON data file **(required)** | — |
| `--output-pattern <pattern>` | Filename pattern with `{field}` placeholders | `<id>-{_index}.<ext>` |
| `--concurrency <number>` | Number of videos to render in parallel | 2 |
| `--fail-fast` | Stop on first error instead of continuing | false |
| `--codec <codec>` | Video codec (h264, h265, vp8, vp9, prores, gif) | h264 |
| `--crf <number>` | Quality (0-51, lower is better) | 18 |
| `--fps <number>` | Override FPS | — |
| `--width <number>` | Override width | — |
| `--height <number>` | Override height | — |
| `--scale <number>` | Resolution multiplier | 1 |
| `--output-dir <path>` | Output directory | `./outputs` |
| `--muted` | Disable audio | false |
| `--frontend-url <url>` | Frontend URL for rendering | `http://localhost:3000` |

## Data File Formats

### CSV

Each column becomes a prop. The header row defines the prop names.

```csv
name,role,color
Alice,Lead Engineer,blue
Bob,Product Designer,pink
Charlie,DevOps Lead,green
```

- Quoted fields and commas within quotes are supported
- Values are auto-converted: `"true"` → `true`, `"42"` → `42`

### JSON

A top-level array of objects. Each object becomes the props for one render.

```json
[
  { "name": "Alice", "role": "Lead Engineer", "color": "blue" },
  { "name": "Bob", "role": "Product Designer", "color": "pink" },
  { "name": "Charlie", "role": "DevOps Lead", "color": "green" }
]
```

## Output Naming

Use `--output-pattern` with `{field}` placeholders to generate filenames from your data:

| Placeholder | Description |
|-------------|-------------|
| `{fieldName}` | Replaced with the value of that field from the data row |
| `{_index}` | Zero-padded row index (e.g., `000`, `001`, `002`) |
| `{compositionId}` | The composition ID |

```bash
# Use the "name" field from each row
--output-pattern "{name}-welcome.mp4"
# → Alice-welcome.mp4, Bob-welcome.mp4, Charlie-welcome.mp4

# Use index for guaranteed uniqueness
--output-pattern "video-{_index}.mp4"
# → video-000.mp4, video-001.mp4, video-002.mp4

# Combine fields
--output-pattern "{name}-{role}.mp4"
# → Alice-Lead-Engineer.mp4, Bob-Product-Designer.mp4
```

Characters unsafe for filenames (`/\:*?"<>|`) are replaced with `-`.

## Examples

### Personalized welcome videos from CSV

```bash
npx framely batch welcome-card --data team.csv \
  --output-pattern "{name}-welcome.mp4" \
  --concurrency 3
```

### Product catalog videos from JSON

```bash
npx framely batch product-card --data products.json \
  --output-pattern "{sku}-{productName}.mp4" \
  --codec h264 --crf 18
```

### Weekly reports with fail-fast

```bash
npx framely batch weekly-report --data reports.json \
  --fail-fast \
  --output-pattern "report-week-{week}.mp4"
```

## How It Works

1. Loads and parses the data file (CSV or JSON)
2. Resolves output filenames from the pattern
3. Fetches composition metadata once (dimensions, FPS, duration)
4. Renders videos in parallel up to `--concurrency` limit
5. Each job launches its own browser, passes the row as props
6. Reports progress and prints a summary when done

## Error Handling

By default, batch rendering **continues** when a single job fails and reports a summary at the end. Use `--fail-fast` to stop immediately on the first error.

```
  ─── Summary ───
  Total:     10
  Success:   8
  Failed:    2
  Time:      45.3s
  Output:    /path/to/outputs
```
