import React from "react";
import { CircleUser } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IRecipe } from "@/types/recipe";

interface MealPlan {
  _id: string;
  title: string;
}

interface ProfileDialogsProps {
  // Followers/Following dialog state
  followersDialogOpen: boolean;
  followingDialogOpen: boolean;
  setFollowersDialogOpen: (open: boolean) => void;
  setFollowingDialogOpen: (open: boolean) => void;
  followers: string[];
  following: string[];
  idToUsername: {[id: string]: string};
  
  // Recipe delete dialog state
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  recipeToDelete: IRecipe | null;
  deleting: boolean;
  onConfirmDeleteRecipe: () => void;
  
  // Meal plan delete dialog state
  deleteMealplanDialogOpen: boolean;
  setDeleteMealplanDialogOpen: (open: boolean) => void;
  mealplanToDelete: MealPlan | null;
  deletingMealplan: boolean;
  onConfirmDeleteMealplan: () => void;
}

const ProfileDialogs = ({
  followersDialogOpen,
  followingDialogOpen,
  setFollowersDialogOpen,
  setFollowingDialogOpen,
  followers,
  following,
  idToUsername,
  deleteDialogOpen,
  setDeleteDialogOpen,
  recipeToDelete,
  deleting,
  onConfirmDeleteRecipe,
  deleteMealplanDialogOpen,
  setDeleteMealplanDialogOpen,
  mealplanToDelete,
  deletingMealplan,
  onConfirmDeleteMealplan
}: ProfileDialogsProps) => {
  return (
    <>
      {/* Followers Dialog */}
      <AlertDialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Followers</AlertDialogTitle>
            <AlertDialogDescription>
              Users that follow you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {followers.length ? (
              followers.map((id) => (
                <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-2">
                  <CircleUser className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-800">
                    {idToUsername[id] || id}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No followers yet.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Following Dialog */}
      <AlertDialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Following</AlertDialogTitle>
            <AlertDialogDescription>
              Users that you are following.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 overflow-y-auto">
            {following.length ? (
              following.map((id) => (
                <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-2">
                  <CircleUser className="h-5 w-5 text-emerald-600" />
                  <span className="text-gray-800">
                    {idToUsername[id] || id}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Not following anyone yet.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Recipe Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone and will remove the recipe from all pages including the community feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDeleteRecipe}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Recipe"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Meal Plan Delete Dialog */}
      <AlertDialog open={deleteMealplanDialogOpen} onOpenChange={setDeleteMealplanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mealplanToDelete?.title}"? This action cannot be undone and will:
              <br />• Remove the meal plan from Browse page
              <br />• Delete all imported copies from user's My Week pages
              <br />• Remove it from all user favorites
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingMealplan}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDeleteMealplan}
              disabled={deletingMealplan}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingMealplan ? "Deleting..." : "Delete Meal Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProfileDialogs; 