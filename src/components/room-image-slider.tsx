import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomImageSliderProps {
  images: string[];
  alt: string;
  aspectRatio?: string;
  className?: string;
  overlayBadges?: React.ReactNode;
  priceBadge?: React.ReactNode;
  showExpandButton?: boolean;
}

export function RoomImageSlider({
  images,
  alt,
  aspectRatio = "aspect-[4/3]",
  className,
  overlayBadges,
  priceBadge,
  showExpandButton = true,
}: RoomImageSliderProps) {
  // Normalize images: filter out empty or falsy strings
  const validImages = React.useMemo(() => {
    const list = (images || []).filter(Boolean);
    return list.length > 0
      ? list
      : [
          "https://mfzxlpmqtoryrdkfnpat.supabase.co/storage/v1/object/public/oda%20web%20pictures/hero-resort.jpg",
        ];
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const total = validImages.length;

  const nextSlide = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setCurrentIndex((prev) => (prev + 1) % total);
    },
    [total],
  );

  const prevSlide = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setCurrentIndex((prev) => (prev - 1 + total) % total);
    },
    [total],
  );

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe && total > 1) {
      nextSlide();
    } else if (isRightSwipe && total > 1) {
      prevSlide();
    }
  };

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextSlide, prevSlide]);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden group select-none bg-muted/30",
          aspectRatio,
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((src, idx) => (
            <div key={idx} className="relative h-full w-full shrink-0 overflow-hidden">
              <img
                src={src}
                alt={`${alt} — Photo ${idx + 1}`}
                loading={idx === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Soft dark vignette on bottom and top for readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-80" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent opacity-60" />

        {/* Custom Overlay Badges (Occupied, Popular, Status, etc.) */}
        {overlayBadges}

        {/* Top-Right Badges: Photo count indicator & Lightbox button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
          {total > 1 && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium tracking-wider text-white backdrop-blur-md shadow-sm border border-white/10">
              <Images className="h-3 w-3 text-gold" />
              <span>
                {currentIndex + 1}/{total}
              </span>
            </div>
          )}
          {showExpandButton && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              title="Expand photos"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold hover:text-gold-foreground hover:scale-110 shadow-sm"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Price Badge (if provided) */}
        {priceBadge}

        {/* Navigation Arrows (shown if more than 1 image) */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prevSlide}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full",
                "bg-black/50 text-white backdrop-blur-md border border-white/15",
                "transition-all duration-300 hover:bg-forest-deep hover:scale-110 shadow-md",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={nextSlide}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full",
                "bg-black/50 text-white backdrop-blur-md border border-white/15",
                "transition-all duration-300 hover:bg-forest-deep hover:scale-110 shadow-md",
                isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Slide Progress / Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
              {validImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => goToSlide(idx, e)}
                  aria-label={`Go to image ${idx + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === currentIndex
                      ? "w-5 bg-gold"
                      : "w-1.5 bg-white/60 hover:bg-white",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Luxury Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="absolute top-0 inset-x-0 p-5 flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg text-white/90">{alt}</span>
              <span className="text-xs uppercase tracking-widest text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/30">
                {currentIndex + 1} of {total}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main Stage Image */}
          <div
            className="relative max-h-[82vh] max-w-[92vw] overflow-hidden flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validImages[currentIndex]}
              alt={`${alt} — Photo ${currentIndex + 1}`}
              className="max-h-[78vh] max-w-full object-contain rounded-md shadow-2xl transition-all duration-300"
            />

            {/* Lightbox Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous"
                  className="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-gold-foreground transition-all backdrop-blur-md border border-white/20"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next"
                  className="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-gold hover:text-gold-foreground transition-all backdrop-blur-md border border-white/20"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {total > 1 && (
            <div
              className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-2 p-2 overflow-x-auto max-w-2xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {validImages.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded border-2 transition-all duration-300",
                    idx === currentIndex
                      ? "border-gold scale-105 shadow-md"
                      : "border-transparent opacity-50 hover:opacity-100",
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

