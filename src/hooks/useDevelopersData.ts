import { useState } from "react";

export function useDevelopersData() {
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [docContents, setDocContents] = useState<Record<string, string>>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});

  const loadDocContent = async (filename: string) => {
    if (docContents[filename]) return;
    
    setLoadingDocs(prev => ({ ...prev, [filename]: true }));
    try {
      const response = await fetch(`/${filename}`);
      if (response.ok) {
        const content = await response.text();
        setDocContents(prev => ({ ...prev, [filename]: content }));
      }
    } catch (error) {
      console.error(`Error loading ${filename}:`, error);
    } finally {
      setLoadingDocs(prev => ({ ...prev, [filename]: false }));
    }
  };

  const toggleDoc = (filename: string) => {
    const isExpanding = !expandedDocs[filename];
    setExpandedDocs(prev => ({ ...prev, [filename]: isExpanding }));
    if (isExpanding) {
      loadDocContent(filename);
    }
  };

  return {
    expandedDocs,
    docContents,
    loadingDocs,
    toggleDoc
  };
}
