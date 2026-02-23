import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Framely',
  description: 'Programmatic video creation with React',
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap', rel: 'stylesheet' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API', link: '/api/components/absolute-fill' },
      { text: 'CLI', link: '/cli/' },
      {
        text: 'Links',
        items: [
          { text: 'GitHub', link: 'https://github.com/codellyson/framely' },
          { text: 'npm', link: 'https://www.npmjs.com/package/framely' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Project Structure', link: '/guide/project-structure' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Compositions', link: '/guide/compositions' },
            { text: 'Timeline & Frames', link: '/guide/timeline' },
            { text: 'Animations', link: '/guide/animations' },
            { text: 'Sequences', link: '/guide/sequences' },
          ],
        },
        {
          text: 'AI Agents',
          items: [
            { text: 'LLM.txt', link: '/guide/llm-txt' },
          ],
        }
      ],
      '/api/': [
        {
          text: 'Components',
          items: [
            { text: 'AbsoluteFill', link: '/api/components/absolute-fill' },
            { text: 'Sequence', link: '/api/components/sequence' },
            { text: 'Series', link: '/api/components/series' },
            { text: 'Loop', link: '/api/components/loop' },
            { text: 'Img', link: '/api/components/img' },
            { text: 'Video', link: '/api/components/video' },
            { text: 'Audio', link: '/api/components/audio' },
          ],
        },
        {
          text: 'Hooks',
          items: [
            { text: 'useCurrentFrame', link: '/api/hooks/use-current-frame' },
            { text: 'useVideoConfig', link: '/api/hooks/use-video-config' },
          ],
        },
        {
          text: 'Animation',
          items: [
            { text: 'interpolate()', link: '/api/animation/interpolate' },
            { text: 'spring()', link: '/api/animation/spring' },
            { text: 'Easing', link: '/api/animation/easing' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI',
          items: [
            { text: 'Overview', link: '/cli/' },
            { text: 'framely preview', link: '/cli/preview' },
            { text: 'framely render', link: '/cli/render' },
            { text: 'framely batch', link: '/cli/batch' },

          ],
        },
      ],
      '/rendering/': [
        {
          text: 'Rendering',
          items: [
            { text: 'Rendering Video', link: '/rendering/' },
            { text: 'Rendering Stills', link: '/rendering/stills' },
            { text: 'Codecs & Formats', link: '/rendering/codecs' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/codellyson/framely' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026-present Codellyson',
    },
    editLink: {
      pattern: 'https://github.com/codellyson/framely/edit/main/packages/docs/:path',
    },
  },
})
