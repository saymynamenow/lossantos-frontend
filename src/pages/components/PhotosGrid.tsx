import React from "react";
import type { Media } from "../../type";

type PhotosGridProps = {
  media: (Media & { postId: string })[];
  onImageClick?: (media: Media & { postId: string }) => void;
  showAll?: boolean;
  maxPhotos?: number;
};

const PhotosGrid: React.FC<PhotosGridProps> = ({
  media,
  onImageClick,
  showAll = false,
  maxPhotos = 9,
}) => {
  if (!media || media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl text-gray-300 mb-4">📷</div>
        <p className="text-gray-500 text-base">No photos to show</p>
        <p className="text-gray-400 text-sm mt-1">
          Photos from posts will appear here
        </p>
      </div>
    );
  }

  const url = import.meta.env.VITE_UPLOADS_URL;

  // Show either limited photos or all photos based on showAll prop
  const displayMedia = showAll ? media : media.slice(0, maxPhotos);
  const shouldShowMoreIndicator = !showAll && media.length > maxPhotos;

  return (
    <div
      className={`grid gap-2 ${
        showAll ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5" : "grid-cols-3"
      }`}
    >
      {displayMedia.map((mediaItem, index) => (
        <div
          key={`${mediaItem.id}-${index}`}
          className="aspect-square relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100"
          onClick={() => onImageClick?.(mediaItem)}
        >
          <img
            src={`${url}/${mediaItem.url}`}
            alt={`Photo ${index + 1}`}
            className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-75"
            loading="lazy"
          />

          {/* Hover overlay with zoom icon */}
          <div className="absolute inset-0 bg-black opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-lg"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Show count indicator for last image if there are more photos */}
          {shouldShowMoreIndicator && index === maxPhotos - 1 && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
              <div className="text-center">
                <span className="text-white text-2xl font-bold block">
                  +{media.length - maxPhotos}
                </span>
                <span className="text-white text-xs opacity-90">
                  more photos
                </span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Fill empty slots if less than maxPhotos for better grid appearance (only for grid view) */}
      {!showAll &&
        displayMedia.length < maxPhotos &&
        Array.from({ length: maxPhotos - displayMedia.length }).map(
          (_, index) => (
            <div
              key={`empty-${index}`}
              className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center"
            >
              <div className="text-gray-300 text-2xl">📷</div>
            </div>
          )
        )}
    </div>
  );
};

export default PhotosGrid;
