// Utility function to get difficulty color
export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case "easy":
    case "beginner":
      return "bg-green-100 text-green-800";
    case "medium":
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "hard":
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Utility function to capitalize first letter
export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Smart profile navigation utility - ensures consistent behavior when clicking on profiles
export const navigateToProfile = (navigate: (path: string) => void, userId: string, currentUserId?: string) => {
  if (userId === currentUserId) {
    // Navigate to same page as Navigation Profile button
    navigate('/profile');
  } else {
    // Navigate to other user's profile
    navigate(`/users/${userId}`);
  }
};

export function checkNutrientRange(value: number | undefined, range: [string, string]) {
  const min = Number(range[0]);
  const max = Number(range[1]);
  return (range[0] === "" || (value ?? 0) >= min) && (range[1] === "" || (value ?? 0) <= max);
} 