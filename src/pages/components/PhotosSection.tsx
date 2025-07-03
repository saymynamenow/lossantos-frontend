import PhotosGrid from "./PhotosGrid";
import type { Media } from "../../type";

interface PhotosSectionProps {
  media: (Media & { postId: string })[];
  onImageClick?: (media: Media & { postId: string }) => void;
  onBackToTimeline: () => void;
  loading?: boolean;
}

export default function PhotosSection({
  media,
  onImageClick,
  onBackToTimeline,
  loading = false,
}: PhotosSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          All Photos
          {Array.isArray(media) && (
            <span className="text-lg font-normal text-gray-500 ml-2">
              ({media.length})
            </span>
          )}
        </h2>
        <button
          onClick={onBackToTimeline}
          className="text-blue-600 hover:underline font-medium"
        >
          ← Back to Timeline
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading photos...</p>
        </div>
      ) : Array.isArray(media) && media.length > 0 ? (
        <PhotosGrid
          media={media}
          onImageClick={onImageClick}
          showAll={true}
          maxPhotos={media.length}
        />
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
            <div className="text-4xl text-gray-400">📷</div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Photos Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Photos from posts will appear here once you start sharing.
          </p>
          <button
            onClick={onBackToTimeline}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Back to Timeline
          </button>
        </div>
      )}
    </div>
  );
}
