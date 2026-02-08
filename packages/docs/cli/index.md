# CLI Overview

The `@codellyson/framely-cli` package provides commands for previewing and rendering your video compositions.

## Installation

The CLI is included when you scaffold a project with `create-framely`. You can also install it manually:

```bash
npm install @codellyson/framely-cli
```

## Commands

| Command | Description |
|---------|-------------|
| `framely preview` | Start the studio dev server |
| `framely render <id>` | Render a composition to video |
| `framely still <id>` | Render a single frame as an image |
| `framely compositions` | List all registered compositions |

## Usage

```bash
# Start the studio
npx framely preview

# Render a video
npx framely render my-video video.mp4

# Render a still frame
npx framely still my-video frame.png --frame 60

# List compositions
npx framely compositions
```
