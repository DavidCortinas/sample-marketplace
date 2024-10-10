import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

export function useDraggableInPortal() {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    setPortalNode(node);
    return () => {
      document.body.removeChild(node);
    };
  }, []);

  return useCallback(
    (render: (provided: any, snapshot: any) => React.ReactElement) =>
      (provided: any, snapshot: any) => {
        const element = render(provided, snapshot);
        if (snapshot.isDragging && portalNode) {
          return createPortal(element, portalNode);
        }
        return element;
      },
    [portalNode]
  );
}
