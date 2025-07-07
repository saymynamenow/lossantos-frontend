import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../type";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RightSidebar from "./components/RightSidebar";
import UserBadges from "./components/UserBadges";
import { FaceIcon, PlusIcon, Cross2Icon } from "@radix-ui/react-icons";
import apiService from "../services/api";
import { canUserSendFriendRequest } from "../utils/accountStatus";
import { AccountStatusWarning } from "../components/AccountStatusWarning";

interface FriendSuggestion extends User {
  mutualFriends?: number;
  reason?: string;
}

const PeoplePage: React.FC = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      // Get current user
      const userData = await apiService.user.getCurrentUser();
      setCurrentUser(userData);

      // Get friend suggestions (you'll need to implement this API endpoint)
      // For now, we'll get all users and filter out friends
      const response = await apiService.user.getAllUser();
      const allUsers = response.users || [];

      // Get current user's friends
      const friendsResponse = await apiService.friend.getMyFriends();
      const friends = friendsResponse.friends || [];
      const friendIds = friends.map((friend: User) => friend.id);

      // Filter out current user and friends first
      const initialFilteredUsers = allUsers.filter(
        (user: User) => user.id !== userData.id && !friendIds.includes(user.id)
      );

      // Check friendship status for each remaining user to filter out pending requests
      const filteredSuggestions = [];
      for (const user of initialFilteredUsers) {
        try {
          const statusResponse = await apiService.friend.getFriendshipStatus(
            user.id
          );
          const status = statusResponse.status;

          // Only include users with no friendship status (not friends, no pending requests)
          if (status === "none" || status === null || status === undefined) {
            filteredSuggestions.push(user);
          }
        } catch (error) {
          // If status check fails, assume no relationship and include the user
          filteredSuggestions.push(user);
        }
      }

      // Add mock mutual friends count and reasons
      const suggestionsWithMeta = filteredSuggestions.map((user: User) => ({
        ...user,
        mutualFriends: Math.floor(Math.random() * 15) + 1,
        reason: getRandomReason(),
      }));

      setSuggestions(suggestionsWithMeta.slice(0, 20)); // Limit to 20 suggestions
    } catch (error) {
      console.error("Failed to fetch friend suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomReason = () => {
    const reasons = [
      "Lives in your city",
      "Went to your school",
      "Works at a similar company",
      "Friends with your friends",
      "In your contacts",
      "Suggested for you",
      "Recently joined",
      "Active in your area",
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!canUserSendFriendRequest(currentUser)) return;

    try {
      setSendingRequests((prev) => new Set(prev).add(userId));

      await apiService.friend.sendFriendRequest(userId);

      // Remove from suggestions after sending request
      setSuggestions((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setSendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestions((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  if (loading) {
    return (
      <div className="">
        <NavigationBar />
        <div className="min-h-screen bg-gray-100 flex">
          <Sidebar />

          <div className="w-full max-w-6xl mx-20 my-12 relative z-20">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                People You May Know
              </h1>
              <p className="text-gray-600">
                Connect with friends and discover new people
              </p>
            </div>

            {/* Loading skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                >
                  <div className="h-32 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto -mt-8 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <div className="w-full max-w-6xl mx-20 my-12 relative z-20">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              People You May Know
            </h1>
            <p className="text-gray-600">
              Connect with friends and discover new people
            </p>
          </div>

          {/* Account Status Warning */}
          {currentUser && !canUserSendFriendRequest(currentUser) && (
            <div className="mb-8">
              <AccountStatusWarning user={currentUser} />
            </div>
          )}

          {/* Suggestions Grid */}
          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suggestions.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Cover/Background */}
                  <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                    <button
                      onClick={() => handleDismiss(user.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                    >
                      <Cross2Icon className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="p-4 text-center">
                    {/* Profile Picture */}
                    <button
                      onClick={() => handleViewProfile(user.username)}
                      className="w-16 h-16 rounded-full overflow-hidden mx-auto -mt-8 mb-3 border-4 border-white shadow-lg hover:scale-105 transition-transform"
                    >
                      {user.profilePicture && user.profilePicture !== "null" ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FaceIcon className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                    </button>

                    {/* User Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <button
                          onClick={() => handleViewProfile(user.username)}
                          className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {user.name}
                        </button>
                        <UserBadges
                          isVerified={user.isVerified}
                          isPro={user.isProUser}
                        />
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        @{user.username}
                      </p>

                      {/* Mutual Friends */}
                      {user.mutualFriends && user.mutualFriends > 0 && (
                        <p className="text-xs text-gray-500 mb-1">
                          {user.mutualFriends} mutual friends
                        </p>
                      )}

                      {/* Reason */}
                      {user.reason && (
                        <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full inline-block">
                          {user.reason}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleSendFriendRequest(user.id)}
                        disabled={
                          sendingRequests.has(user.id) ||
                          !canUserSendFriendRequest(currentUser)
                        }
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                          canUserSendFriendRequest(currentUser)
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        } ${
                          sendingRequests.has(user.id)
                            ? "bg-blue-400 cursor-not-allowed"
                            : ""
                        }`}
                        title={
                          !canUserSendFriendRequest(currentUser)
                            ? "Account restricted - cannot send friend requests"
                            : ""
                        }
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>
                          {sendingRequests.has(user.id)
                            ? "Sending..."
                            : "Add Friend"}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDismiss(user.id)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* No Suggestions */
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaceIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                No new suggestions
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We'll suggest new people for you to connect with as more users
                join the platform.
              </p>
              <button
                onClick={fetchSuggestions}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Suggestions
              </button>
            </div>
          )}

          {/* Refresh Button */}
          {suggestions.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={fetchSuggestions}
                className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                See More Suggestions
              </button>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
};

export default PeoplePage;
