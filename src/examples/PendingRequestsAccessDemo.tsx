import { useState } from "react";
import { ClockIcon, PersonIcon, CheckIcon } from "@radix-ui/react-icons";

const PendingRequestsAccessDemo = () => {
  const [selectedRole, setSelectedRole] = useState<
    "owner" | "admin" | "moderator" | "member" | "none"
  >("none");

  const getAccessStatus = (role: string) => {
    const canAccess =
      role === "owner" || role === "admin" || role === "moderator";
    return {
      canAccess,
      color: canAccess ? "green" : "red",
      icon: canAccess ? "✅" : "❌",
      text: canAccess ? "Can Access" : "Cannot Access",
    };
  };

  const roles = [
    {
      value: "owner",
      label: "Page Owner",
      description: "Full control over the page",
    },
    {
      value: "admin",
      label: "Administrator",
      description: "Can edit page and manage requests",
    },
    {
      value: "moderator",
      label: "Moderator",
      description: "Can manage requests but cannot edit page",
    },
    { value: "member", label: "Member", description: "Regular page member" },
    {
      value: "none",
      label: "Non-member",
      description: "Not a member of the page",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
          <ClockIcon className="w-8 h-8 mr-3 text-orange-500" />
          Pending Requests Access Control
        </h1>
        <p className="text-gray-600 mb-6">
          Test different user roles to see who can access the pending requests
          management interface.
        </p>

        {/* Role Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select User Role:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value as any)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === role.value
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium text-gray-900 mb-1">
                    {role.label}
                  </div>
                  <div className="text-xs text-gray-600">
                    {role.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Access Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Access Status for:{" "}
            <span className="text-blue-600">
              {roles.find((r) => r.value === selectedRole)?.label}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">
                View Pending Requests
              </h4>
              <div
                className={`flex items-center space-x-2 text-${
                  getAccessStatus(selectedRole).color
                }-600`}
              >
                <span className="text-lg">
                  {getAccessStatus(selectedRole).icon}
                </span>
                <span className="font-medium">
                  {getAccessStatus(selectedRole).text}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">
                Approve Requests
              </h4>
              <div
                className={`flex items-center space-x-2 text-${
                  getAccessStatus(selectedRole).color
                }-600`}
              >
                <span className="text-lg">
                  {getAccessStatus(selectedRole).icon}
                </span>
                <span className="font-medium">
                  {getAccessStatus(selectedRole).text}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-800 mb-2">
                Reject Requests
              </h4>
              <div
                className={`flex items-center space-x-2 text-${
                  getAccessStatus(selectedRole).color
                }-600`}
              >
                <span className="text-lg">
                  {getAccessStatus(selectedRole).icon}
                </span>
                <span className="font-medium">
                  {getAccessStatus(selectedRole).text}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Complete Permission Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approve/Reject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit Page
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post Content
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => {
                  const canManageRequests = [
                    "owner",
                    "admin",
                    "moderator",
                  ].includes(role.value);
                  const canEdit = ["owner", "admin"].includes(role.value);
                  const canPost = [
                    "owner",
                    "admin",
                    "moderator",
                    "member",
                  ].includes(role.value);

                  return (
                    <tr
                      key={role.value}
                      className={
                        selectedRole === role.value ? "bg-blue-50" : ""
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PersonIcon className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {role.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canManageRequests
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {canManageRequests ? "✅ Yes" : "❌ No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canManageRequests
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {canManageRequests ? "✅ Yes" : "❌ No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canEdit
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {canEdit ? "✅ Yes" : "❌ No"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            canPost
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {canPost ? "✅ Yes" : "❌ No"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <CheckIcon className="w-5 h-5 mr-2" />
            Implementation Notes
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>
              • <strong>Owners</strong> have full control - can edit page
              details and manage requests
            </li>
            <li>
              • <strong>Admins</strong> can edit page details and manage
              requests but don't own the page
            </li>
            <li>
              • <strong>Moderators</strong> can manage join requests but cannot
              edit page details
            </li>
            <li>
              • <strong>Members</strong> can post content but cannot manage
              requests or edit page
            </li>
            <li>
              • <strong>Non-members</strong> can only view content and request
              to join
            </li>
          </ul>
        </div>

        {/* Code Example */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Code Implementation
          </h3>
          <pre className="text-sm text-gray-800 overflow-x-auto">
            {`// In PageHeader component
const canManageRequests = isOwner || 
  currentUserRole === "admin" || 
  currentUserRole === "moderator";

// Show requests button for authorized roles
{canManageRequests && pendingRequestsCount > 0 && (
  <button onClick={() => setShowPendingRequestsModal(true)}>
    <ClockIcon />
    Requests ({pendingRequestsCount})
  </button>
)}

// In PendingRequestsModal
if (!canManageRequests) {
  return <AccessDeniedMessage />;
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PendingRequestsAccessDemo;
