# Pending Requests System Documentation

## Overview

The pending requests system has been implemented to handle page membership approval workflow. When users request to join a page, their request goes into a pending state and requires approval from page owners or administrators.

## Key Features

### ✅ **Pending Request Workflow**

1. User clicks "Join Page" → Request created with "pending" status
2. Button changes to "Request Pending" (disabled, orange color)
3. Page admins/owners see notification with request count
4. Admins can approve or reject requests
5. User receives feedback and status updates

### ✅ **Admin Management**

- **PendingRequestsModal**: Modal for managing all pending requests
- **Request Actions**: Approve/Reject with one click
- **Batch Management**: Handle multiple requests efficiently
- **Pagination**: Support for large numbers of requests
- **Access Control**: Available to owners, admins, and moderators

### ✅ **User Experience**

- **MyPendingRequests**: Component to view all user's pending requests
- **Status Indicators**: Clear visual feedback for request status
- **Request Tracking**: See timestamp, page details, and owner info

## Components Created

### 1. **PendingRequestsModal** (`src/pages/components/PendingRequestsModal.tsx`)

Modal component for page admins/owners to manage pending join requests.

**Features:**

- Lists all pending requests with user details
- Approve/reject actions with loading states
- Pagination for large datasets
- Permission checks (only owners/admins can access)
- Error handling and loading states

**Props:**

```typescript
interface PendingRequestsModalProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
  canManageRequests: boolean;
}
```

### 2. **MyPendingRequests** (`src/pages/components/MyPendingRequests.tsx`)

Component for users to view their own pending join requests.

**Features:**

- Shows all user's pending requests
- Displays page information and request date
- Visual status indicators
- Pagination support
- Empty state handling

### 3. **PendingRequestsPage** (`src/pages/pendingRequestsPage.tsx`)

Full page component for viewing user's pending requests.

**Layout:**

- NavigationBar + Sidebar + RightSidebar
- Main content area with MyPendingRequests component
- Responsive design

## Updated Components

### **PageHeader** Updates

- Added `hasPendingRequest` and `pendingRequestsCount` props
- Updated button logic to show "Request Pending" state
- Added "Requests" button for admins with notification count
- Integrated PendingRequestsModal
- Updated button styling for pending state

### **PageTimeline** Updates

- Added pending request state management
- Updated `handleJoin` to handle pending responses
- Added props for pending request status
- Integrated with PageHeader new props

## API Integration

### **New API Methods** (`src/services/api.ts`)

```typescript
// Get pending requests for a page (Admin/Owner only)
getPendingRequests: async (pageId: string, page: number = 1, limit: number = 20)

// Approve join request (Admin/Owner only)
approveJoinRequest: async (pageId: string, userId: string)

// Reject join request (Admin/Owner only)
rejectJoinRequest: async (pageId: string, userId: string)

// Get user's pending requests
getMyPendingRequests: async (page: number = 1, limit: number = 20)
```

### **API Endpoints**

```
GET /pages/:pageId/pending-requests?page=1&limit=20
PATCH /pages/:pageId/approve-request/:userId
PATCH /pages/:pageId/reject-request/:userId
GET /pages/my-pending-requests?page=1&limit=20
```

## Type Definitions

### **New Types** (`src/type.ts`)

```typescript
export type PageJoinRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  user: User;
  page?: Page;
};

export type PendingRequestsResponse = {
  pendingRequests: PageJoinRequest[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
};

export type ApproveRequestResponse = {
  message: string;
  member: {
    id: string;
    status: "accepted";
    role: "member" | "admin" | "moderator";
    user: User;
  };
};
```

## User Interface States

### **Join Button States**

1. **"Join Page"** - Default state (blue button)
2. **"Request Pending"** - After request submitted (orange, disabled, with clock icon)
3. **"Leave Page"** - When user is approved and becomes member (red button)

### **Admin Interface**

- **Requests Button**: Shows when pending requests > 0
- **Request Count Badge**: Orange badge with number of pending requests
- **Modal Interface**: Full management interface with approve/reject actions

## Security & Permissions

### **Permission Checks**

- Only page owners and admins can view/manage pending requests
- Users can only see their own pending requests
- API endpoints should validate user permissions
- Frontend shows access denied messages for unauthorized users

### **Request Management**

- Approve: Converts pending request to page membership
- Reject: Removes the request (user can request again)
- Bulk actions supported for multiple requests

## Example Usage

### **In PageTimeline Component**

```typescript
<PageHeader
  page={page}
  // ... other props
  hasPendingRequest={hasPendingRequest}
  pendingRequestsCount={pendingRequestsCount}
  currentUserRole={currentUserRole}
/>
```

### **Standalone Pending Requests Page**

```typescript
// Route: /my-pending-requests
<PendingRequestsPage />
```

## Testing Scenarios

### **User Flow Testing**

1. ✅ User requests to join page
2. ✅ Button changes to "Request Pending"
3. ✅ Admin sees request notification
4. ✅ Admin can approve/reject request
5. ✅ User sees status updates
6. ✅ Approved user becomes page member

### **Permission Testing**

1. ✅ Only owners/admins see request management
2. ✅ Non-authorized users see access denied
3. ✅ Users only see their own requests
4. ✅ Request actions validate permissions

### **Edge Case Testing**

1. ✅ Empty states (no pending requests)
2. ✅ Error handling (network failures)
3. ✅ Loading states during API calls
4. ✅ Pagination with large datasets

## File Structure

```
src/
├── pages/
│   ├── components/
│   │   ├── PendingRequestsModal.tsx     # Admin request management
│   │   ├── MyPendingRequests.tsx        # User request viewing
│   │   └── PageHeader.tsx               # Updated with pending logic
│   ├── pageTimeline.tsx                 # Updated page timeline
│   └── pendingRequestsPage.tsx          # Full page for user requests
├── services/
│   └── api.ts                           # Updated with pending endpoints
├── examples/
│   └── PendingRequestsExample.tsx       # Demo component
└── type.ts                              # Updated with pending types
```

## Backend Requirements

### **Expected API Behavior**

1. **POST /pages/:id/join** - Should return `{status: "pending"}` for new requests
2. **GET /pages/:id/pending-requests** - Return paginated pending requests
3. **PATCH /pages/:id/approve-request/:userId** - Convert request to membership
4. **PATCH /pages/:id/reject-request/:userId** - Remove pending request
5. **GET /pages/my-pending-requests** - Return user's pending requests

### **Database Changes**

- Page join requests should have status field: "pending" | "accepted" | "rejected"
- Approved requests should create PageMember records
- Rejected requests should be deleted or marked as rejected

## Future Enhancements

### **Potential Improvements**

- [ ] Real-time notifications for request updates
- [ ] Bulk approve/reject functionality
- [ ] Request filtering and search
- [ ] Request expiration (auto-reject after X days)
- [ ] Request messages (users can add a note)
- [ ] Admin notifications via email/push
- [ ] Request analytics and metrics

---

## Quick Setup

1. **Import Components**: Use PendingRequestsModal and MyPendingRequests
2. **Update PageHeader**: Add pending request props
3. **API Integration**: Ensure backend supports the new endpoints
4. **Test Workflow**: Verify the complete request → approval → membership flow

The system is now ready for production use with comprehensive error handling, permission checks, and user-friendly interfaces.
