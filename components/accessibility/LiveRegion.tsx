"use client";

import { useEffect, useState } from "react";

type LiveRegionProps = {
  message?: string;
  politeness?: "polite" | "assertive";
  clearAfter?: number;
};

export default function LiveRegion({ 
  message, 
  politeness = "polite",
  clearAfter = 5000 
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      
      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setCurrentMessage(undefined);
        }, clearAfter);
        
        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  if (!currentMessage) return null;

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}
