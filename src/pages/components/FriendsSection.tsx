import { useNavigate } from "react-router-dom";
import { FaceIcon } from "@radix-ui/react-icons";
import UserBadges from "./UserBadges";

interface Friend {
  id: string;
  name?: string;
  username: string;
  profilePicture?: string;
  isVerified?: boolean;
  isPro?: boolean;
}

interface FriendsSectionProps {
  friends: Friend[];
  friendsLoading: boolean;
  onBackToTimeline: () => void;
}

export default function FriendsSection({
  friends,
  friendsLoading,
  onBackToTimeline,
}: FriendsSectionProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          All Friends
          {Array.isArray(friends) && (
            <span className="text-lg font-normal text-gray-500 ml-2">
              ({friends.length})
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

      {friendsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading friends...</p>
        </div>
      ) : Array.isArray(friends) && friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {friends.map((friend: Friend) => (
            <div
              key={friend.id}
              className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition cursor-pointer border"
              onClick={() => navigate(`/profile/${friend.username}`)}
            >
              {/* Profile Picture */}
              <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mx-auto mb-4">
                {friend.profilePicture ? (
                  <img
                    src={friend.profilePicture}
                    alt={friend.name || friend.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <FaceIcon
                      width={40}
                      height={40}
                      className="text-gray-600"
                    />
                  </div>
                )}
              </div>

              {/* Friend Info */}
              <div className="flex flex-col items-center">
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                  {friend.name || friend.username || "Anonymous User"}
                  <UserBadges
                    isVerified={friend.isVerified}
                    isPro={friend.isPro}
                    size="sm"
                    className="ml-1"
                  />
                </h3>
                <p className="text-sm text-gray-500 mb-4">@{friend.username}</p>

                {/* Action Buttons */}
                <div className="flex space-x-2 w-full">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${friend.username}`);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle message action
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
            <FaceIcon width={32} height={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Friends Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start connecting with people to see your friends here.
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
