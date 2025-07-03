import React, { useState } from "react";
import {
  GearIcon,
  LockClosedIcon,
  TrashIcon,
  Cross2Icon,
} from "@radix-ui/react-icons";
import { toast } from "react-toastify";
import type { User, Page } from "../../type";
import apiService from "../../services/api";

interface PageSettingsManagementProps {
  page: Page;
  currentUser: User;
  currentUserRole: "admin" | "moderator" | "member" | "none";
  isOwner: boolean;
}

const PageSettingsManagement: React.FC<PageSettingsManagementProps> = ({
  page,
  currentUser,
  currentUserRole,
  isOwner,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const canManageSettings = isOwner || currentUserRole === "admin";
  const expectedDeleteText = `I Want To Delete My Page With :${page.name}`;

  const handleDeletePage = async () => {
    if (deleteConfirmText !== expectedDeleteText) {
      setDeleteError("Please type the exact phrase to confirm deletion");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");
      await apiService.page.deletePage(page.id);
      toast.success(`Page "${page.name}" has been deleted successfully`);
      // Redirect to pages list after successful deletion
      setTimeout(() => {
        window.location.href = "/pages"; // or use your routing method
      }, 2000);
    } catch (error: any) {
      console.error("Failed to delete page:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to delete page. Please try again.";
      setDeleteError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeleteError("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GearIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Page Settings
            </h2>
          </div>
          <p className="text-gray-600 mt-1">
            Configure page privacy, permissions, and advanced settings
          </p>
        </div>

        <div className="p-6">
          {!canManageSettings ? (
            <div className="text-center py-12">
              <LockClosedIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Restricted
              </h3>
              <p className="text-gray-600">
                Only page owners and administrators can access settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Privacy Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Privacy Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Page Visibility
                      </h4>
                      <p className="text-sm text-gray-600">
                        Control who can see your page
                      </p>
                    </div>
                    <select className="border border-gray-300 rounded px-3 py-1">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Join Approval
                      </h4>
                      <p className="text-sm text-gray-600">
                        Require approval for new members
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Member Permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Member Permissions
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Members Can Post
                      </h4>
                      <p className="text-sm text-gray-600">
                        Allow members to create posts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Members Can Invite
                      </h4>
                      <p className="text-sm text-gray-600">
                        Allow members to invite others
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dangerous Actions */}
              {isOwner && (
                <div>
                  <h3 className="text-lg font-medium text-red-900 mb-4">
                    Danger Zone
                  </h3>
                  <div className="border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-900">
                          Delete Page
                        </h4>
                        <p className="text-sm text-red-600">
                          Permanently delete this page and all its content
                        </p>
                      </div>
                      <button
                        onClick={openDeleteModal}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Page
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-red-900">
                  Delete Page Confirmation
                </h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 text-black ">
                <p className="text-sm mb-4 ">
                  This action cannot be undone. This will permanently delete the
                  page "{page.name}" and all of its content.
                </p>

                <p className="text-sm font-medium text-gray-900 mb-2">
                  Please type the following to confirm:
                </p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded border mb-3">
                  {expectedDeleteText}
                </p>

                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type the confirmation text here"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />

                {deleteError && (
                  <p className="text-sm text-red-600 mt-2">{deleteError}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePage}
                  disabled={
                    deleteConfirmText !== expectedDeleteText || isDeleting
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Page"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSettingsManagement;
