# LLM.txt

Framely ships an `llm.txt` file at the root of the repository. This is a machine-readable reference document designed to help LLMs (large language models) understand the project structure, APIs, and conventions when assisting with development.

## What is llm.txt?

`llm.txt` is a standardized format for providing project context to AI coding assistants. When an LLM reads this file, it gains a comprehensive understanding of:

- **Project architecture** — monorepo layout, packages, and their roles
- **Core APIs** — every component, hook, and utility with signatures and examples
- **CLI commands** — all available commands with full option lists
- **Template system** — registry format, installation flow, discovery
- **Configuration** — config files and the setter API
- **Authoring patterns** — how to write compositions, handle async data, use transitions

## Usage

### With AI coding assistants

Point your AI assistant to the `llm.txt` file at the repository root:

```
framely/llm.txt
```

Most AI coding tools (Claude Code, Cursor, GitHub Copilot, etc.) will automatically pick up this file or can be directed to read it for project context.

### Direct URL

You can reference the raw file from GitHub:

```
https://raw.githubusercontent.com/codellyson/framely/main/llm.txt
```

Or via jsDelivr CDN:

```
https://cdn.jsdelivr.net/gh/codellyson/framely@main/llm.txt
```

## What's included

The `llm.txt` covers the complete Framely API surface:

| Section | Contents |
|---------|----------|
| Core Library | TimelineProvider, useCurrentFrame, interpolate, spring, Easing, Sequence, Series, Loop, Freeze, TransitionSeries, Player, and more |
| CLI | render, still, preview, compositions, templates commands |
| Render Pipeline | Playwright + FFmpeg architecture, codec table, parallel rendering |
| Studio | Vite dev server, virtual modules, UI architecture |
| Templates | Registry schema, available templates, installation, discovery |
| Configuration | framely.config.js, Config setter API |
| Patterns | Composition authoring, async data with delayRender |
