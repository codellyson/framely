import { createContext, useContext, type ReactNode } from 'react';

/**
 * The folder path represented as an array of folder names from root to current.
 */
type FolderPath = string[];

/**
 * Props for the Folder component.
 */
interface FolderProps {
  /** The folder name displayed in the sidebar */
  name: string;
  /** Child elements (Compositions or nested Folders) */
  children: ReactNode;
}

/**
 * Context for tracking folder hierarchy
 */
const FolderContext = createContext<FolderPath>([]);

/**
 * Hook to access the current folder path
 *
 * Returns:
 *   string[] - Array of folder names from root to current
 *
 * Usage:
 *   const path = useFolder();
 *   console.log(path.join(' / ')); // "Effects / Transitions"
 */
export function useFolder(): FolderPath {
  return useContext(FolderContext);
}

/**
 * Folder organizes compositions in the Studio sidebar.
 *
 * Folders can be nested to create hierarchical organization.
 * They don't affect rendering — they're purely for organization in the UI.
 *
 * Props:
 *   name - The folder name displayed in the sidebar
 *
 * Usage:
 *   <Folder name="Marketing">
 *     <Composition id="promo-video" ... />
 *     <Folder name="Social">
 *       <Composition id="instagram-reel" ... />
 *       <Composition id="tiktok-clip" ... />
 *     </Folder>
 *   </Folder>
 */
export function Folder({ name, children }: FolderProps): JSX.Element {
  const parentPath: FolderPath = useContext(FolderContext);
  const currentPath: FolderPath = [...parentPath, name];

  return (
    <FolderContext.Provider value={currentPath}>
      {children}
    </FolderContext.Provider>
  );
}

export default Folder;
