import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import Sidebar from "./components/Sidebar";
import RigthSidebar from "./components/RightSidebar";
import { ImageIcon, ArrowLeftIcon } from "@radix-ui/react-icons";
import apiService from "../services/api";

const PageCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Technology",
    website: "",
    email: "",
    phone: "",
    address: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    "Technology",
    "Health & Fitness",
    "Food & Dining",
    "Arts & Culture",
    "Business",
    "Entertainment",
    "Education",
    "Sports",
    "Travel",
    "Fashion",
    "Music",
    "Gaming",
    "Nonprofit",
    "Government",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "profile") {
        setProfilePicture(file);
      } else {
        setCoverPhoto(file);
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Page name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Page name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Page description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const pageData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        profileImage: profilePicture || undefined,
        coverImage: coverPhoto || undefined,
      };

      const response = await apiService.page.createPage(pageData);

      // Navigate to the newly created page
      navigate(`/page/${response.page.id}`);
    } catch (error) {
      console.error("Failed to create page:", error);
      setErrors({ submit: "Failed to create page. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <NavigationBar />

      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />

        <div className="w-full max-w-4xl mx-20 my-12 relative z-20">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/pages")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Pages</span>
            </button>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Page
              </h1>
              <p className="text-gray-600 mt-2">
                Build your community and connect with others
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-md overflow-hidden text-black "
          >
            {/* Cover Photo Section */}
            <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
              {coverPhoto && (
                <img
                  src={URL.createObjectURL(coverPhoto)}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              )}
              <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors">
                <div className="text-white text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">Add Cover Photo</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "cover")}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-8">
              {/* Profile Picture */}
              <div className="relative -mt-16 mb-8">
                <div className="w-32 h-32 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {profilePicture ? (
                    <img
                      src={URL.createObjectURL(profilePicture)}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <label className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                      <div className="text-gray-600 text-center">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs">Add Photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "profile")}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Page Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your page name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what your page is about"
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.description ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State, ZIP"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate("/pages")}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium mr-4"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Creating..." : "Create Page"}
                </button>
              </div>
            </div>
          </form>
        </div>

        <RigthSidebar />
      </div>
    </div>
  );
};

export default PageCreate;
