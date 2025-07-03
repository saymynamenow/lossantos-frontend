import React, { useState, useEffect, useRef } from "react";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  Pencil1Icon,
  TrashIcon,
  EyeOpenIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import { formatDistanceToNow } from "date-fns";
import { sponsoredService } from "../../services/api";
import MentionInput, { type MentionInputRef } from "./MentionInput";
import MentionTextarea, { type MentionTextareaRef } from "./MentionTextarea";
import MentionText from "./MentionText";

// Custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface SponsoredPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  link?: string | null;
  isActive: "active" | "pending" | "rejected" | "expired";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

function SponsoredManagement() {
  const [sponsoredPosts, setSponsoredPosts] = useState<SponsoredPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  // const [totalPages, setTotalPages] = useState(1); // For future pagination UI
  const [hasMore, setHasMore] = useState(true);
  const [expandedImages, setExpandedImages] = useState<{
    [key: string]: boolean;
  }>({});

  // Use debounced search term to prevent API calls on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Modal and form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SponsoredPost | null>(null);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    content: "",
    link: "",
    status: "pending" as "active" | "pending",
    startDate: "",
    endDate: "",
  });
  const [editFormData, setEditFormData] = useState({
    title: "",
    content: "",
    link: "",
    status: "pending" as "active" | "pending",
    startDate: "",
    endDate: "",
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editUploadedImage, setEditUploadedImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [editFormErrors, setEditFormErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: "approving" | "rejecting" | null;
  }>({});

  // Refs for mention inputs
  const titleInputRef = useRef<MentionInputRef>(null);
  const contentInputRef = useRef<MentionTextareaRef>(null);
  const editTitleInputRef = useRef<MentionInputRef>(null);
  const editContentInputRef = useRef<MentionTextareaRef>(null);

  useEffect(() => {
    fetchSponsoredPosts();
  }, []);

  // Reset pagination when filters change (using debounced search term)
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchSponsoredPosts(1);
  }, [filterStatus, debouncedSearchTerm]);

  const fetchSponsoredPosts = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await sponsoredService.getSponsoredPosts(page, 10); // 10 posts per page for admin

      if (page === 1) {
        setSponsoredPosts(response.posts || response);
      } else {
        setSponsoredPosts((prev) => [...prev, ...(response.posts || response)]);
      }

      // Handle pagination info if available in response
      if (response.pagination) {
        setCurrentPage(response.pagination.currentPage);
        // setTotalPages(response.pagination.totalPages); // For future pagination UI
        setHasMore(response.pagination.hasMore);
      } else {
        // Fallback if pagination info not available
        setHasMore((response.posts || response).length === 10);
      }
    } catch (error) {
      console.error("Failed to fetch sponsored posts", error);
      if (page === 1) {
        setSponsoredPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredPosts = sponsoredPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || post.isActive === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleApprove = async (postId: string) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [postId]: "approving" }));
      await sponsoredService.acceptSponsoredPost(postId);
      setSponsoredPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isActive: "active" as const } : post
        )
      );
    } catch (error) {
      console.error("Failed to approve post", error);
      // You might want to show an error message to the user here
    } finally {
      setLoadingActions((prev) => ({ ...prev, [postId]: null }));
    }
  };

  const handleReject = async (postId: string) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [postId]: "rejecting" }));
      await sponsoredService.rejectSponsoredPost(postId);
      setSponsoredPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isActive: "rejected" as const } : post
        )
      );
    } catch (error) {
      console.error("Failed to reject post", error);
      // You might want to show an error message to the user here
    } finally {
      setLoadingActions((prev) => ({ ...prev, [postId]: null }));
    }
  };

  const toggleImageExpansion = (postId: string) => {
    setExpandedImages((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Handler functions for view, edit, and delete actions
  const handleViewPost = (post: SponsoredPost) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleEditPost = (post: SponsoredPost) => {
    setSelectedPost(post);
    setEditFormData({
      title: post.title,
      content: post.content,
      link: post.link || "",
      status: post.isActive === "active" ? "active" : "pending",
      startDate: new Date(post.startDate).toISOString().slice(0, 16),
      endDate: new Date(post.endDate).toISOString().slice(0, 16),
    });
    if (post.imageUrl) {
      setEditImagePreview(post.imageUrl);
    }
    setShowEditModal(true);
  };

  const handleDeletePost = (post: SponsoredPost) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPost) return;

    setIsDeleting(true);
    try {
      await sponsoredService.deleteSponsoredPost(selectedPost.id);
      setSponsoredPosts((prev) =>
        prev.filter((post) => post.id !== selectedPost.id)
      );
      setShowDeleteModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error("Failed to delete post", error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false);
    }
  };

  // Form handlers
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setCreateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!createFormData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!createFormData.content.trim()) {
      errors.content = "Content is required";
    }

    if (!createFormData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!createFormData.endDate) {
      errors.endDate = "End date is required";
    }

    if (createFormData.startDate && createFormData.endDate) {
      const start = new Date(createFormData.startDate);
      const end = new Date(createFormData.endDate);
      if (end <= start) {
        errors.endDate = "End date must be after start date";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Get the formatted content with mentions from the inputs
      const titleValue =
        titleInputRef.current?.getFormattedValue() || createFormData.title;
      const contentValue =
        contentInputRef.current?.getFormattedValue() || createFormData.content;

      formData.append("title", titleValue);
      formData.append("content", contentValue);
      formData.append("link", createFormData.link);
      formData.append("status", createFormData.status);

      // Convert datetime-local format to ISO string for database
      const startDateISO = new Date(createFormData.startDate).toISOString();
      const endDateISO = new Date(createFormData.endDate).toISOString();

      formData.append("startDate", startDateISO);
      formData.append("endDate", endDateISO);

      if (uploadedImage) {
        formData.append("image", uploadedImage);
      }

      const newPost = await sponsoredService.createSponsoredPost(formData);

      // Add the new post to the beginning of the list
      setSponsoredPosts((prev) => [newPost, ...prev]);

      // Reset form and close modal
      setCreateFormData({
        title: "",
        content: "",
        link: "",
        status: "pending",
        startDate: "",
        endDate: "",
      });
      // Clear the mention inputs
      titleInputRef.current?.clear();
      contentInputRef.current?.clear();
      setUploadedImage(null);
      setImagePreview(null);
      setFormErrors({});
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create sponsored post:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      title: "",
      content: "",
      link: "",
      status: "pending",
      startDate: "",
      endDate: "",
    });
    // Clear the mention inputs
    titleInputRef.current?.clear();
    contentInputRef.current?.clear();
    setUploadedImage(null);
    setImagePreview(null);
    setFormErrors({});
  };

  // Form handlers for edit modal
  const handleEditImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (editFormErrors[field]) {
      setEditFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateEditForm = () => {
    const errors: { [key: string]: string } = {};

    if (!editFormData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!editFormData.content.trim()) {
      errors.content = "Content is required";
    }

    if (!editFormData.startDate) {
      errors.startDate = "Start date is required";
    }

    if (!editFormData.endDate) {
      errors.endDate = "End date is required";
    }

    if (editFormData.startDate && editFormData.endDate) {
      const start = new Date(editFormData.startDate);
      const end = new Date(editFormData.endDate);
      if (end <= start) {
        errors.endDate = "End date must be after start date";
      }
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm() || !selectedPost) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Get the formatted content with mentions from the inputs
      const titleValue =
        editTitleInputRef.current?.getFormattedValue() || editFormData.title;
      const contentValue =
        editContentInputRef.current?.getFormattedValue() ||
        editFormData.content;

      formData.append("title", titleValue);
      formData.append("content", contentValue);
      formData.append("link", editFormData.link);
      formData.append("status", editFormData.status);

      // Convert datetime-local format to ISO string for database
      const startDateISO = new Date(editFormData.startDate).toISOString();
      const endDateISO = new Date(editFormData.endDate).toISOString();

      formData.append("startDate", startDateISO);
      formData.append("endDate", endDateISO);

      if (editUploadedImage) {
        formData.append("image", editUploadedImage);
      }

      const updatedPost = await sponsoredService.updateSponsoredPost(
        selectedPost.id,
        formData
      );

      // Update the post in the list with the response from the server
      setSponsoredPosts((prev) =>
        prev.map((post) => (post.id === selectedPost.id ? updatedPost : post))
      );

      handleCloseEditModal();
    } catch (error) {
      console.error("Failed to update sponsored post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedPost(null);
    setEditFormData({
      title: "",
      content: "",
      link: "",
      status: "pending",
      startDate: "",
      endDate: "",
    });
    // Clear the mention inputs
    editTitleInputRef.current?.clear();
    editContentInputRef.current?.clear();
    setEditUploadedImage(null);
    setEditImagePreview(null);
    setEditFormErrors({});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Sponsored Content</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Sponsored Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              key="search-input"
              type="text"
              placeholder="Search sponsored posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Sponsored Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {loading
                ? "Loading sponsored posts..."
                : sponsoredPosts.length === 0
                ? "No sponsored posts available"
                : "No sponsored posts found"}
            </h3>
            <p className="text-gray-600">
              {loading
                ? "Please wait while we fetch the latest sponsored content."
                : sponsoredPosts.length === 0
                ? "There are no sponsored posts in the system yet."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {post.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        post.isActive
                      )}`}
                    >
                      {post.isActive.charAt(0).toUpperCase() +
                        post.isActive.slice(1)}
                    </span>
                  </div>
                  <div className="text-gray-600 mb-3">
                    <MentionText text={post.content} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">
                        Start Date:
                      </span>
                      <p className="text-gray-900">
                        {new Date(post.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        End Date:
                      </span>
                      <p className="text-gray-900">
                        {new Date(post.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Status:</span>
                      <p className="text-gray-900 capitalize">
                        {post.isActive}
                      </p>
                    </div>
                    {post.imageUrl && (
                      <div className="col-span-full">
                        <span className="font-medium text-gray-500">
                          Image:
                        </span>
                        <div className="mt-2 mb-2">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className={`w-full object-contain rounded-lg cursor-pointer transition-all duration-300 hover:opacity-80 border border-gray-200 ${
                              expandedImages[post.id]
                                ? "max-h-none shadow-lg"
                                : "max-h-48 shadow-sm"
                            }`}
                            onClick={() => toggleImageExpansion(post.id)}
                            title={
                              expandedImages[post.id]
                                ? "Click to collapse"
                                : "Click to expand"
                            }
                          />
                          <div className="flex items-center justify-center mt-2">
                            <button
                              onClick={() => toggleImageExpansion(post.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                            >
                              {expandedImages[post.id] ? (
                                <>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="18,15 12,9 6,15"></polyline>
                                  </svg>
                                  <span>Collapse Image</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="6,9 12,15 18,9"></polyline>
                                  </svg>
                                  <span>Expand Image</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {post.link && (
                      <div className="col-span-full">
                        <span className="font-medium text-gray-500">Link:</span>
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-2 break-all"
                        >
                          {post.link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewPost(post)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeOpenIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditPost(post)}
                    className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil1Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost(post)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>
                    Created{" "}
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>
                    Updated{" "}
                    {formatDistanceToNow(new Date(post.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      new Date(post.endDate) > new Date()
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {new Date(post.endDate) > new Date()
                      ? "Active Period"
                      : "Expired"}
                  </span>
                </div>

                {post.isActive === "pending" && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(post.id)}
                      disabled={loadingActions[post.id] === "approving"}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {loadingActions[post.id] === "approving" ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Approving...</span>
                        </>
                      ) : (
                        <span>Approve</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      disabled={loadingActions[post.id] === "rejecting"}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {loadingActions[post.id] === "rejecting" ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Rejecting...</span>
                        </>
                      ) : (
                        <span>Reject</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !loading && filteredPosts.length > 0 && (
        <div className="text-center py-6">
          <button
            onClick={() => fetchSponsoredPosts(currentPage + 1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Load More Posts
          </button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading && currentPage > 1 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <p className="text-gray-500 mt-2 text-sm">Loading more posts...</p>
        </div>
      )}

      {/* Create Sponsored Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Sponsored Post
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <MentionInput
                  value={createFormData.title}
                  onChange={(value) => handleFormChange("title", value)}
                  ref={titleInputRef}
                  placeholder="Enter sponsored post title. Use @username to mention users."
                  className={`w-full ${
                    formErrors.title ? "border-red-500" : ""
                  }`}
                />
                {formErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.title}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <MentionTextarea
                  value={createFormData.content}
                  onChange={(value) => handleFormChange("content", value)}
                  ref={contentInputRef}
                  rows={4}
                  placeholder="Enter sponsored post content. Use @username to mention users."
                  className={`w-full ${
                    formErrors.content ? "border-red-500" : ""
                  }`}
                />
                {formErrors.content && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.content}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Tip: Use @username to mention users in your content
                </p>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={createFormData.link}
                  onChange={(e) => handleFormChange("link", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg shadow-sm"
                      />
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setUploadedImage(null);
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove Image
                        </button>
                        <label className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="space-y-2">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <div className="text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-800">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </div>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={createFormData.status}
                  onChange={(e) => handleFormChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={createFormData.startDate}
                    onChange={(e) =>
                      handleFormChange("startDate", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.startDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {formErrors.startDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={createFormData.endDate}
                    onChange={(e) =>
                      handleFormChange("endDate", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.endDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {formErrors.endDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Sponsored Post</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sponsored Post Modal */}
      {showEditModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Sponsored Post
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <MentionInput
                  value={editFormData.title}
                  onChange={(value) => handleEditFormChange("title", value)}
                  ref={editTitleInputRef}
                  placeholder="Enter sponsored post title. Use @username to mention users."
                  className={`w-full ${
                    editFormErrors.title ? "border-red-500" : ""
                  }`}
                />
                {editFormErrors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {editFormErrors.title}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <MentionTextarea
                  value={editFormData.content}
                  onChange={(value) => handleEditFormChange("content", value)}
                  ref={editContentInputRef}
                  rows={4}
                  placeholder="Enter sponsored post content. Use @username to mention users."
                  className={`w-full ${
                    editFormErrors.content ? "border-red-500" : ""
                  }`}
                />
                {editFormErrors.content && (
                  <p className="text-red-500 text-sm mt-1">
                    {editFormErrors.content}
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  Tip: Use @username to mention users in your content
                </p>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  value={editFormData.link}
                  onChange={(e) => handleEditFormChange("link", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {editImagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg shadow-sm"
                      />
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditImagePreview(null);
                            setEditUploadedImage(null);
                          }}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove Image
                        </button>
                        <label className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50 transition-colors cursor-pointer">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="space-y-2">
                        <svg
                          className="w-12 h-12 text-gray-400 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <div className="text-gray-600">
                          <span className="font-medium text-blue-600 hover:text-blue-800">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </div>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    handleEditFormChange("status", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.startDate}
                    onChange={(e) =>
                      handleEditFormChange("startDate", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editFormErrors.startDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {editFormErrors.startDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {editFormErrors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.endDate}
                    onChange={(e) =>
                      handleEditFormChange("endDate", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editFormErrors.endDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {editFormErrors.endDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {editFormErrors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Sponsored Post</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Sponsored Post Modal */}
      {showViewModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  View Sponsored Post
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Title:</h4>
                <p className="text-gray-700">{selectedPost.title}</p>
              </div>

              {/* Content */}
              <div>
                <h4 className="text-md font-medium text-gray-900">Content:</h4>
                <div className="text-gray-700">
                  <MentionText text={selectedPost.content} />
                </div>
              </div>

              {/* Link */}
              {selectedPost.link && (
                <div>
                  <h4 className="text-md font-medium text-gray-900">Link:</h4>
                  <a
                    href={selectedPost.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {selectedPost.link}
                  </a>
                </div>
              )}

              {/* Image */}
              {selectedPost.imageUrl && (
                <div>
                  <h4 className="text-md font-medium text-gray-900">Image:</h4>
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="w-full object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Dates and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900">
                    Start Date:
                  </h4>
                  <p className="text-gray-700">
                    {new Date(selectedPost.startDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900">
                    End Date:
                  </h4>
                  <p className="text-gray-700">
                    {new Date(selectedPost.endDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900">Status:</h4>
                  <p className="text-gray-700 capitalize">
                    {selectedPost.isActive}
                  </p>
                </div>
              </div>

              {/* Created and Updated Info */}
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-600">
                <div className="flex-1">
                  <span className="font-medium">Created:</span>{" "}
                  {formatDistanceToNow(new Date(selectedPost.createdAt), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex-1">
                  <span className="font-medium">Updated:</span>{" "}
                  {formatDistanceToNow(new Date(selectedPost.updatedAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 text-black flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this sponsored post? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Sponsored Post</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(SponsoredManagement);
