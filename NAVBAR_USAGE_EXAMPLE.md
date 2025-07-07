# NavigationBar Usage Example

## Updated NavigationBar Component

The NavigationBar component has been refactored to automatically fetch user data internally, making it much easier to use throughout the application.

### Before (Old Usage)

```tsx
// You had to pass user data as props
<NavigationBar
  username={user?.username}
  profilePicture={user?.profilePicture || undefined}
  onFriendRequestUpdate={onFriendRequestUpdate}
/>
```

### After (New Usage)

```tsx
// Just call the component - no parameters needed!
<NavigationBar />

// Or with optional friend request update callback
<NavigationBar onFriendRequestUpdate={onFriendRequestUpdate} />
```

## How It Works

The NavigationBar component now:

1. **Automatically fetches current user data** using `apiService.user.getCurrentUser()`
2. **Manages its own loading state** with a spinner in the profile avatar
3. **Handles errors gracefully** if user data fails to load
4. **Updates data every 30 seconds** automatically
5. **Shows disabled state** when no user is loaded

## Benefits

- ✅ **Simplified Usage**: No need to pass user data as props
- ✅ **Consistent Data**: Always shows the most current user information
- ✅ **Automatic Updates**: Refreshes friend requests and notifications
- ✅ **Better UX**: Shows loading states and handles errors
- ✅ **Reduced Code**: Less boilerplate in every page component

## Internal State Management

The component manages:

- `currentUser`: The logged-in user's data
- `userLoading`: Loading state for user data
- `friendRequests`: List of pending friend requests
- `notifications`: List of notifications
- `searchResults`: Search functionality data

## API Calls

The component automatically calls:

- `apiService.user.getCurrentUser()` - Get current user data
- `apiService.friend.getReceivedFriendRequests()` - Get friend requests
- `apiService.notification.getNotifications()` - Get notifications
- `apiService.search.search()` - For search functionality

All data is refreshed every 30 seconds automatically.
