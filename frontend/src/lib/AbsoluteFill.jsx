/**
 * A full-size, absolutely positioned container.
 * The building block for layering elements in a composition.
 */
export function AbsoluteFill({ style, children, ...props }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
