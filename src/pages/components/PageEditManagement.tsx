import React, { useState, useRef } from "react";
import { ImageIcon, CheckIcon } from "@radix-ui/react-icons";
import type { Page } from "../../type";
import apiService from "../../services/api";

interface PageEditManagementProps {
  page: Page;
  onPageUpdate: (updatedPage: Page) => void;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
}

const PageEditManagement: React.FC<PageEditManagementProps> = ({
  page,
  onPageUpdate,
  currentUserRole,
  isOwner,
}) => {
  const [formData, setFormData] = useState({
    name: page.name || "",
    description: page.description || "",
    category: page.category || "",
    website: page.website || "",
    email: page.email || "",
    phone: page.phone || "",
    address: page.address || "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const url = import.meta.env.VITE_UPLOADS_URL;

  // Check if user has permission to edit
  const canEdit = isOwner || currentUserRole === "admin";

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear success message when user starts editing
    if (success) setSuccess(null);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      setError("You don't have permission to edit this page");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updateData: any = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
      };

      // Add optional fields only if they have values
      if (formData.website) updateData.website = formData.website;
      if (formData.email) updateData.email = formData.email;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.address) updateData.address = formData.address;

      // Add images if selected
      if (profileImage) updateData.profilePicture = profileImage;
      if (coverImage) updateData.coverPhoto = coverImage;

      const response = await apiService.page.updatePage(page.id, updateData);

      // Update the page data
      onPageUpdate(response.page);
      setSuccess("Page updated successfully!");

      // Clear file inputs and previews
      setProfileImage(null);
      setCoverImage(null);
      setProfilePreview(null);
      setCoverPreview(null);
    } catch (error: any) {
      console.error("Failed to update page:", error);
      setError(error.response?.data?.message || "Failed to update page");
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to edit this page. Only page owners and
            administrators can make changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Edit Page Information
          </h2>
          <p className="text-gray-600 mt-1">
            Update your page details and media
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <CheckIcon className="w-4 h-4 mr-2" />
              {success}
            </div>
          )}

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="relative">
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : page.coverImage ? (
                  <img
                    src={`${url}/${page.coverImage}`}
                    alt="Current cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors rounded-lg"
              >
                <span className="text-white bg-black/50 px-3 py-1 rounded-md text-sm">
                  Change Cover
                </span>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : page.profileImage ? (
                    <img
                      src={`${url}/${page.profileImage}`}
                      alt="Current profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors rounded-lg"
                >
                  <span className="text-white bg-black/50 px-2 py-1 rounded text-xs">
                    Change
                  </span>
                </button>
                <input
                  ref={profileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Upload a new profile picture for your page
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Page Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter page name"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                <option value="business">Business</option>
                <option value="entertainment">Entertainment</option>
                <option value="education">Education</option>
                <option value="community">Community</option>
                <option value="sports">Sports</option>
                <option value="technology">Technology</option>
                <option value="health">Health</option>
                <option value="travel">Travel</option>
                <option value="food">Food</option>
                <option value="fashion">Fashion</option>
                <option value="news">News</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your page..."
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 text-black gap-6">
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 Main St, City, State"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Page"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageEditManagement;
