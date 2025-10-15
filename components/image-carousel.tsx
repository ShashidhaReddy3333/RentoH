"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ImageCarouselProps = {
  images: string[];
  title?: string;
};

export default function ImageCarousel({ images, title }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const isEmpty = !images.length;
  const total = images.length || 1;
  const listRef = useRef<HTMLDivElement>(null);

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
    <div className="relative overflow-hidden rounded-xl bg-[var(--c-bg)]">
      <div
        ref={listRef}
        className="aspect-video flex items-center justify-center bg-cover bg-center transition-all"
        style={{ backgroundImage: isEmpty ? undefined : `url(${images[index]})` }}
        role="img"
        aria-label={title ? `${title} image ${index + 1}` : `Image ${index + 1}`}
      >
        {isEmpty && (
          <span className="text-gray-500 text-sm">No images uploaded yet</span>
        )}
      </div>
      {!isEmpty && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow-soft hover:bg-white"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow-soft hover:bg-white"
            aria-label="Next image"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                className={`h-2.5 w-2.5 rounded-full border border-white transition ${
                  dotIndex === index ? "bg-white" : "bg-white/40"
                }`}
                onClick={() => setIndex(dotIndex)}
                aria-label={`View image ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
