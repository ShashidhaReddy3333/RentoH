"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageCarouselProps = {
  images: string[];
  title?: string;
};

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const total = images.length || 1;
  const isEmpty = !images.length;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  const goTo = useCallback(
    (next: number) => {
      if (!images.length) return;
      const bounded = (next + images.length) % images.length;
      setIndex(bounded);
    },
    [images.length]
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-black/10 bg-surface-muted dark:border-white/10">
      <div
        ref={listRef}
        className="aspect-video flex items-center justify-center bg-cover bg-center transition-all"
        style={{ backgroundImage: isEmpty ? undefined : `url(${images[index]})` }}
        role="img"
        aria-label={title ? `${title} image ${index + 1}` : `Image ${index + 1}`}
      >
        {isEmpty ? <span className="text-sm text-textc/60">No images uploaded yet</span> : null}
      </div>
      {!isEmpty ? (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-surface px-3 py-2 text-textc shadow-soft transition hover:bg-surface-muted"
            aria-label="Previous image"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-surface px-3 py-2 text-textc shadow-soft transition hover:bg-surface-muted"
            aria-label="Next image"
          >
            &gt;
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${
                  dotIndex === index ? "bg-white/90" : "bg-white/30"
                }`}
                onClick={() => setIndex(dotIndex)}
                aria-label={`View image ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
