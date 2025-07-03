import React from "react";
import type { Media } from "../../type";

type PostMediaGridProps = {
  media: Media[];
  onImageClick?: () => void;
};

const PostMediaGrid: React.FC<PostMediaGridProps> = ({
  media,
  onImageClick,
}) => {
  if (!media || media.length === 0) return null;
  if (media.length === 1) {
    return (
      <div className="mb-4">
        <img
          src={media[0].url}
          alt="media-0"
          className="w-full h-auto object-cover rounded cursor-pointer"
          onClick={onImageClick}
        />
      </div>
    );
  }
  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {media.map((m, i) => (
          <img
            key={i}
            src={m.url}
            alt={`media-${i}`}
            className="w-full object-cover rounded cursor-pointer"
            onClick={onImageClick}
          />
        ))}
      </div>
    );
  }

  if (media.length === 3 || media.length === 4 || media.length > 4) {
    return (
      <div className="flex gap-2 mb-4">
        {/* Left big image */}
        <img
          src={media[0].url}
          alt="media-0"
          className="w-1/2 object-cover rounded cursor-pointer"
          onClick={onImageClick}
        />

        {/* Right side: stacked 2 (with optional +N on last one) */}
        <div className="flex flex-col gap-2 w-1/2">
          <img
            src={media[1].url}
            alt="media-1"
            className="w-full h-1/2 object-cover rounded cursor-pointer"
            onClick={onImageClick}
          />
          {media.length > 3 ? (
            <div
              className="relative w-full h-1/2 cursor-pointer"
              onClick={onImageClick}
            >
              <img
                src={media[2].url}
                alt="media-2"
                className="w-full h-full object-cover rounded"
              />
              <div className="absolute inset-0 bg-black opacity-30 flex items-center justify-center text-white text-3xl font-bold rounded">
                +{media.length - 3}
              </div>
            </div>
          ) : (
            <img
              src={media[2].url}
              alt="media-2"
              className="w-full h-1/2 object-cover rounded cursor-pointer"
              onClick={onImageClick}
            />
          )}
        </div>
      </div>
    );
  }
};

export default PostMediaGrid;
