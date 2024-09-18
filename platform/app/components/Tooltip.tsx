import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

interface TooltipProps {
  text: string;
  targetRect: DOMRect | null;
  position: 'top' | 'right' | 'bottom' | 'left';
}

export function Tooltip({ text, targetRect, position }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  if (!targetRect) return null;

  const getTooltipPosition = (): React.CSSProperties => {
    const padding = 5;
    let top, left, transform;

    switch (position) {
      case 'top':
        top = targetRect.top - (tooltipRect?.height || 0) - padding;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + padding;
        transform = 'translateY(-50%)';
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2;
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - (tooltipRect?.width || 0) - padding;
        transform = 'translateY(-50%)';
        break;
    }

    // Adjust for screen edges
    if (tooltipRect) {
      if (left < padding) {
        left = padding;
        transform = 'none';
      } else if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
        transform = 'none';
      }

      if (top < padding) {
        top = padding;
      } else if (top + tooltipRect.height > window.innerHeight - padding) {
        top = window.innerHeight - tooltipRect.height - padding;
      }
    }

    return { top: `${top}px`, left: `${left}px`, transform };
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    ...getTooltipPosition(),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    zIndex: 10000,
    pointerEvents: 'none',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    whiteSpace: 'nowrap',
  };

  return createPortal(
    <div 
      style={tooltipStyle}
      ref={(el) => {
        if (el && !tooltipRect) {
          setTooltipRect(el.getBoundingClientRect());
        }
      }}
    >
      {text}
    </div>,
    document.body
  );
}
