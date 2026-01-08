export interface SearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  bio?: string;
  subscriptionType: string;
  subscriptionStatus: string;
}

export interface UserSubscriptionStatus {
  isPremium: boolean;
  hasAnySubscription: boolean;
} 