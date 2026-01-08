// src/pages/UserPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import {
  Card, 
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  ChefHat,
  Grid3X3,
  Clock,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios';
import { IRecipe } from '@/types/recipe';

interface IUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  subscriptionType: 'free' | 'premium';
  followers: string[];
  following: string[];
  joinedAt: string;
}

const UserPage: React.FC = () => {
  const { user: me, getAccessToken } = useAuth();
  const myId = me?.id;
  const { userId: targetId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [profileRecipes, setProfileRecipes] = useState<IRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<IRecipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<IRecipe | null>(null);
  const [deleting, setDeleting] = useState(false);

  const api = axios.create({ baseURL:'http://localhost:8080', withCredentials:true });
  api.interceptors.request.use(cfg => {
    const t = getAccessToken();
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });

  const fetchProfile = async () => {
    if (!targetId) return;
    const path = `/api/auth/users/${targetId}`;
    console.log('→ fetching profile from', api.defaults.baseURL + path);
    try {
      const { data } = await api.get<IUser>(path);
      // Normalize undefined arrays
      const safeUser: IUser = {
        ...data,
        followers: data.followers ?? [],
        following: data.following ?? [],
      };
      setProfileUser(safeUser);
      setIsFollowing(safeUser.followers!.includes(myId!));
    } catch (err: any) {
      console.error('← fetchProfile error:', err.response?.status, err.response?.data || err.message);
    }
  };

useEffect(() => {
  if (!profileUser) return;
  const fetchRecipes = async () => {
    try {
      // Because you mount your recipes router at `/recipes`
      const { data } = await api.get<IRecipe[]>(
        `/recipes/users/${targetId}/recipes`
      );
      setProfileRecipes(data);
    } catch (err) {
      console.error('Error fetching profile recipes:', err);
    }
  };

  fetchRecipes();
}, [profileUser]);
  const [idToUserData, setIdToUserData] = useState<{[id: string]: IUser}>({});

  useEffect(() => {
    // Gather all unique user IDs from followers and following
    if (!profileUser) return;
    const ids = Array.from(new Set([
      ...profileUser.followers,
      ...profileUser.following,
    ]));

    // Only fetch if there are IDs and not already loaded
    if (ids.length === 0) return;

    // Fetch full user data for each ID
    Promise.all(
      ids.map(id =>
        api.get<IUser>(`/api/auth/users/${id}`)
          .then(res => ({ id, userData: res.data }))
          .catch(() => ({ id, userData: { id, username: id, followers: [], following: [], joinedAt: '', subscriptionType: 'free' as const } })) // fallback if error
      )
    ).then(results => {
      const mapping: {[id: string]: IUser} = {};
      results.forEach(({ id, userData }) => {
        mapping[id] = userData;
      });
      setIdToUserData(mapping);
    });
  }, [profileUser]);

  useEffect(() => {
    if (!me) {
      navigate('/login');
      return;
    }
    setLoading(true);
    Promise.all([fetchProfile()])
    .finally(() => setLoading(false));
  }, [me, targetId]);

const toggleFollow = async () => {
  if (!profileUser) return;
  const followEndpoint = `/api/auth/users/${targetId}/follow`;

  try {
    if (isFollowing) {
      await api.delete(followEndpoint);
      setProfileUser(prev =>
        prev
          ? { ...prev, followers: prev.followers!.filter(id => id !== myId) }
          : null
      );
    } else {
      await api.post(followEndpoint);
      setProfileUser(prev =>
        prev
          ? { ...prev, followers: [...prev.followers!, myId!] }
          : null
      );
    }
    setIsFollowing(!isFollowing);
  } catch (err: any) {
    // log status + payload for easier debugging
    console.error(
      "Follow/unfollow failed:",
      err.response?.status,
      err.response?.data || err.message
    );
  }
};

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    await api.delete(`/recipes/${toDelete._id}`);
    setProfileRecipes(ps=>ps.filter(r=>r._id!==toDelete._id));
    setSavedRecipes(fs=>fs.filter(r=>r._id!==toDelete._id));
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  if (loading || !profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loading ? 'Loading...' : 'User not found'}
      </div>
    );
  }

  const initials = profileUser.firstName
    ? profileUser.firstName[0].toUpperCase()
    : profileUser.username[0].toUpperCase();
  const joined = new Date(profileUser.joinedAt).toLocaleDateString('en-US',{
    year:'numeric', month:'long'
  });
  const stats = {
    recipes: profileRecipes.length,
    followers: profileUser.followers.length,
    following: profileUser.following.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2"/> Back
        </Button>

        {/* PROFILE HEADER */}
        <Card className="border-emerald-100 mb-8">
          <CardContent className="p-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {profileUser.profileImage ? (
            <Avatar className="h-32 w-32 border-4 border-emerald-100">
              <AvatarImage
                src={profileUser.profileImage}
                alt={profileUser.username}
                className="object-cover"
              />
            </Avatar>
          ) : (
            <Avatar className="h-32 w-32 border-4 border-emerald-100 bg-emerald-50">
              <AvatarFallback className="text-emerald-600 text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="absolute -bottom-2 -right-2 bg-emerald-600 rounded-full p-2">
            <ChefHat className="h-4 w-4 text-white" />
          </div>
        </div>
        {/* All the profile info lives here, in the same flex row */}
        <div className="flex-1 text-center md:text-left md:pl-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileUser.firstName
                  ? `${profileUser.firstName} ${profileUser.lastName || ''}`
                  : profileUser.username}
              </h1>
              <p className="text-emerald-600 font-medium">@{profileUser.username}</p>
              {profileUser.subscriptionType === 'premium' && (
                <Badge className="mt-1 bg-emerald-600 text-white">
                  <ChefHat className="h-3 w-3 mr-1" /> Premium
                </Badge>
              )}
            </div>
            {targetId !== myId && (
              <Button
                onClick={toggleFollow}
                variant={isFollowing ? 'outline' : 'default'}
                className="mt-4 md:mt-0"
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
          <div className="flex justify-center md:justify-start gap-6 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{stats.recipes}</p>
              <p className="text-sm text-gray-600">Recipes</p>
            </div>
            {/* Followers */}
            <div
              className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
              onClick={() => setFollowersDialogOpen(true)}
            >
              <p className="text-xl font-bold text-gray-900">{stats.followers}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            {/* Following */}
            <div
              className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
              onClick={() => setFollowingDialogOpen(true)}
            >
              <p className="text-xl font-bold text-gray-900">{stats.following}</p>
              <p className="text-sm text-gray-600">Following</p>
            </div>
            {/* Followers Dialog */}
            <AlertDialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
              <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Followers</AlertDialogTitle>
                        <AlertDialogDescription>
                List of users that {profileUser.username} is followed by.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="max-h-64 overflow-y-auto">
              {profileUser.followers.length ? (
                profileUser.followers.map((id) => {
                  const userData = idToUserData[id];
                  const initials = userData?.username 
                    ? userData.username[0].toUpperCase() 
                    : id[0].toUpperCase();             
              return (
                <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {userData?.profileImage ? (
                      <AvatarImage
                        src={userData.profileImage}
                        alt={userData.username}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="text-gray-800 cursor-pointer hover:text-emerald-600 hover:underline"
                    onClick={() => {
                      navigate(`/users/${id}`);
                      setFollowersDialogOpen(false);
                    }}
                  >
                    {userData?.username || id}
                  </span>
                </div>
              );
            })
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
            List of users that {profileUser.username} is following.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-64 overflow-y-auto">
          {profileUser.following.length ? (
            profileUser.following.map((id) => {
              const userData = idToUserData[id];
              const initials = userData?.username 
                ? userData.username[0].toUpperCase() 
                : id[0].toUpperCase();
              
              return (
                <div key={id} className="py-2 border-b last:border-b-0 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {userData?.profileImage ? (
                      <AvatarImage
                        src={userData.profileImage}
                        alt={userData.username}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className="text-gray-800 cursor-pointer hover:text-emerald-600 hover:underline"
                    onClick={() => {
                      navigate(`/users/${id}`);
                      setFollowingDialogOpen(false);
                    }}
                  >
                    {userData?.username || id}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">Not following anyone yet.</p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {profileUser.bio && (
        <p className="mt-4 text-gray-700 max-w-lg mx-auto md:mx-0">
          {profileUser.bio}
        </p>
      )}
    </div>
  </div>
</CardContent>
        </Card>
        {/* TABS - Only Recipes */}
        <Tabs
          value="recipes"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="recipes">
              <Grid3X3 className="mr-1 inline" /> Recipes ({stats.recipes})
            </TabsTrigger>
          </TabsList>

          {/* RECIPES */}
          <TabsContent value="recipes">
            {profileRecipes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileRecipes.map((r) => (
            <Card
              key={r._id}
              className="relative group cursor-pointer"
              onClick={() => navigate(`/recipes/${r._id}`)}
            >
              {/* only show your own-delete menu */}
              {targetId === myId && (
                <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
              e.stopPropagation();
              navigate(`/recipes/${r._id}`);
                  }}
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => {
              e.stopPropagation();
              setToDelete(r);
              setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
                </div>
              )}
              <img
                src={r.image ? `http://localhost:8080/${r.image}` : '/placeholder.svg'}
                alt={r.name}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="p-2">
                <h3 className="font-semibold">{r.name}</h3>
                {r.prepTimeMin && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" /> {r.prepTimeMin} min
            </div>
                )}
              </div>
            </Card>
          ))}
              </div>
            ) : (
              <p className="text-center py-12 text-gray-500">No recipes yet.</p>
            )}
          </TabsContent>
        </Tabs>
        {/* DELETE DIALOG */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{toDelete?.name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default UserPage;
