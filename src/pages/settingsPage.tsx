import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import { isAccountRestricted } from "../utils/accountStatus";
import { AccountStatusWarning } from "../components/AccountStatusWarning";
import VerificationRequestForm from "./components/VerificationRequestForm";
import type { User } from "../type";
import apiService from "../services/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);
  const [myVerificationRequests, setMyVerificationRequests] = useState<any[]>(
    []
  );
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    fetchUserData();
    if (activeTab === "verification") {
      fetchMyVerificationRequests();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await apiService.user.getCurrentUser();
      setUser(response);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      setError("Failed to load user settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVerificationRequests = async () => {
    try {
      setVerificationLoading(true);
      const response = await apiService.verification.getMyRequests();
      setMyVerificationRequests(response.requests || response.data || []);
    } catch (error) {
      console.error("Failed to fetch verification requests:", error);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSaveProfile = async (profileData: Partial<User>) => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Filter to only include allowed fields and handle null values
      const allowedFields = [
        "name",
        "bio",
        "profilePicture",
        "coverPicture",
        "location",
        "studyField",
        "relationshipStatus",
        "relationships",
        "birthdate",
        "gender",
      ];

      const filteredProfileData: Record<string, string | undefined> = {};
      allowedFields.forEach((field) => {
        if (field in profileData) {
          const value = profileData[field as keyof typeof profileData];
          if (typeof value === "string") {
            // Handle birthdate field specially to ensure ISO-8601 format
            if (field === "birthdate" && value) {
              // Convert date string to ISO-8601 DateTime format
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                filteredProfileData[field] = date.toISOString();
              }
            } else {
              filteredProfileData[field] = value || undefined;
            }
          }
        }
      });

      const response = await apiService.user.updateUserProfile(
        user.id,
        filteredProfileData,
        profilePictureFile || undefined
      );

      setUser(response);
      setSuccess("Profile updated successfully!");

      // Clear file upload states
      setProfilePictureFile(null);
      setProfilePicturePreview(null);

      // Clear success message after 3 seconds
      navigate(`/profile/${user.username}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };
  const url = import.meta.env.VITE_UPLOADS_URL;

  const handleInputChange = (field: string, value: string | boolean) => {
    if (!user) return;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null
    );
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPG, JPEG, or PNG)");
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    setProfilePictureFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicturePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Clear any previous errors
    setError(null);
  };

  const resetProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setError(null);
  };

  const tabs = [
    { id: "profile", name: "Profile", icon: "👤" },
    { id: "verification", name: "Verification", icon: "✓" },
    { id: "account", name: "Account", icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavigationBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Settings
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "Unable to load user settings"}
            </p>
            <button
              onClick={() => navigate("/timeline")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go to Timeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationBar />

      {/* Account Status Warning */}
      {isAccountRestricted(user) && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <AccountStatusWarning user={user} />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">
                Manage your account preferences and privacy settings
              </p>
            </div>
            <button
              onClick={() => navigate(`/profile/${user.username}`)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              View Profile
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-8 text-black">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Profile Information
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={user.name || ""}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <input
                          type="text"
                          value={user.username || ""}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                          placeholder="Username cannot be changed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Username cannot be changed after account creation
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={user.bio || ""}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={user.location || ""}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Study Field
                        </label>
                        <input
                          type="text"
                          value={user.studyField || ""}
                          onChange={(e) =>
                            handleInputChange("studyField", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your field of study"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gender
                        </label>
                        <select
                          value={user.gender || ""}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">
                            Prefer not to say
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship Status
                        </label>
                        <select
                          value={user.relationshipStatus || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "relationshipStatus",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Status</option>
                          <option value="single">Single</option>
                          <option value="in-relationship">
                            In a relationship
                          </option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                          <option value="complicated">It's complicated</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Birthdate
                        </label>
                        <input
                          type="date"
                          value={
                            user.birthdate ? user.birthdate.split("T")[0] : ""
                          }
                          onChange={(e) =>
                            handleInputChange("birthdate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Relationship With
                        </label>
                        <input
                          type="text"
                          value={user.relationships || ""}
                          onChange={(e) =>
                            handleInputChange("relationships", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Partner's name (if applicable)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Picture
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          {/* Current/Preview Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={
                                profilePicturePreview ||
                                `${url}/${user.profilePicture}` ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.name || user.username
                                )}&background=6366f1&color=fff&size=80`
                              }
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.name || user.username
                                )}&background=6366f1&color=fff&size=80`;
                              }}
                            />
                          </div>

                          {/* File Upload */}
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2">
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                                id="profile-picture-upload"
                              />
                              <label
                                htmlFor="profile-picture-upload"
                                className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 transition inline-block"
                              >
                                Choose New Picture
                              </label>
                              {profilePictureFile && (
                                <button
                                  type="button"
                                  onClick={resetProfilePicture}
                                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Supported formats: JPG, JPEG, PNG (max 5MB)
                            </p>
                          </div>
                        </div>

                        {/* File Info */}
                        {profilePictureFile && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                              Selected: {profilePictureFile.name} (
                              {(profilePictureFile.size / 1024 / 1024).toFixed(
                                2
                              )}{" "}
                              MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        onClick={() => {
                          if (user) {
                            const { username, ...profileData } = user;
                            handleSaveProfile(profileData);
                          }
                        }}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Tab */}
              {activeTab === "verification" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Verification
                  </h2>

                  {/* Current Status */}
                  <div className="mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center">
                        <span className="mr-2">✓</span>
                        Verification Status
                      </h3>
                      <p className="text-blue-700 mb-2">
                        <span className="font-medium">
                          {user.isVerified
                            ? "Verified Account"
                            : "Not Verified"}
                        </span>
                      </p>
                      {user.isVerified ? (
                        <p className="text-sm text-blue-600">
                          Your account has been verified with a blue checkmark.
                        </p>
                      ) : (
                        <p className="text-sm text-blue-600">
                          Get verified to show that your account is authentic
                          and notable.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Request Actions */}
                  {!showVerificationForm && !user.isVerified && (
                    <div className="mb-8">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Request Verification
                      </h3>
                      <button
                        onClick={() => setShowVerificationForm(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <span>✓</span>
                        <span>Request Verification</span>
                      </button>
                    </div>
                  )}

                  {/* Verification Request Form */}
                  {showVerificationForm && (
                    <div className="mb-8">
                      <VerificationRequestForm
                        onSuccess={() => {
                          setShowVerificationForm(false);
                          fetchMyVerificationRequests();
                          setSuccess(
                            "Verification request submitted successfully!"
                          );
                        }}
                        onCancel={() => setShowVerificationForm(false)}
                      />
                    </div>
                  )}

                  {/* My Verification Requests */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        My Verification Requests
                      </h3>
                      <button
                        onClick={fetchMyVerificationRequests}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Refresh
                      </button>
                    </div>

                    {verificationLoading ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-8">
                        <div className="animate-pulse space-y-4">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    ) : myVerificationRequests.length > 0 ? (
                      <div className="space-y-4">
                        {myVerificationRequests.map((request: any) => (
                          <div
                            key={request.id}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Verification
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      request.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : request.status === "under-review"
                                        ? "bg-blue-100 text-blue-800"
                                        : request.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {request.status.charAt(0).toUpperCase() +
                                      request.status.slice(1).replace("-", " ")}
                                  </span>
                                </div>
                                <p className="text-gray-700 mb-2">
                                  {request.reason}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Submitted{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {request.rejectionReason && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-medium text-red-900 text-sm mb-1">
                                  Rejection Reason:
                                </h4>
                                <p className="text-red-700 text-sm">
                                  {request.rejectionReason}
                                </p>
                              </div>
                            )}

                            {request.notes && (
                              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="font-medium text-gray-900 text-sm mb-1">
                                  Admin Notes:
                                </h4>
                                <p className="text-gray-700 text-sm">
                                  {request.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">✓</span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No verification requests yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          You haven't submitted any verification requests yet.
                        </p>
                        {!user.isVerified && (
                          <button
                            onClick={() => setShowVerificationForm(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Submit Your First Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Account Settings
                  </h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Account Status
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Your account status:{" "}
                        <span className="font-medium capitalize">
                          {user.accountStatus}
                        </span>
                      </p>
                      {user.accountStatus !== "active" && (
                        <p className="text-sm text-red-600">
                          Your account is currently restricted. Some features
                          may be limited.
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">
                        Account Verification
                      </h3>
                      <p className="text-sm text-blue-700 mb-2">
                        Verification status:{" "}
                        <span className="font-medium">
                          {user.isVerified ? "Verified" : "Not Verified"}
                        </span>
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-lg font-medium text-red-900 mb-2">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        These actions are irreversible. Please be careful.
                      </p>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to deactivate your account? This action cannot be undone."
                            )
                          ) {
                            // Handle account deactivation
                          }
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition"
                      >
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
