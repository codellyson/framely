import { createContext, useContext } from 'react';

/**
 * Context for tracking folder hierarchy
 */
const FolderContext = createContext([]);

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
export function useFolder() {
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
export function Folder({ name, children }) {
  const parentPath = useContext(FolderContext);
  const currentPath = [...parentPath, name];

  return (
    <FolderContext.Provider value={currentPath}>
      {children}
    </FolderContext.Provider>
  );
}

export default Folder;
