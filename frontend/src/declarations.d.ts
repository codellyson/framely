declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css' {}

interface ImportMeta {
  readonly env: Record<string, string>;
}
