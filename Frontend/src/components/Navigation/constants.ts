export const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/community", label: "Community" },
  { path: "/my-week", label: "Meal Planning" },
  { path: "/browse", label: "Browse" },
  { path: "/ai-chatbot", label: "AI Chef" },
] as const;

export const getUserInitials = (firstName?: string, username?: string) => {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const usernameInitial = username ? username.charAt(0).toUpperCase() : '';
  return firstInitial || usernameInitial || "U";
}; 