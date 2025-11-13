import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000";

interface ProfilePageProps {
  authToken: string;
  profile: {
    id: string;
    username?: string;
  };
  onBack: () => void;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onToggleFollow: (targetId: string, nextState: boolean) => void;
  reloadKey: number;
  currentUserFollowing?: number;
}

type ProfileInfo = {
  id: string;
  username: string;
  followers: number;
  following: number;
  reactions: number;
  avatar: string;
  posts: string[];
};

function normalizeId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value.$oid) return value.$oid;
    if (value.oid) return value.oid;
  }
  return String(value);
}

const DEFAULT_AVATAR = (username?: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username ?? "be4real")}`;

export function ProfilePage({
  authToken,
  profile,
  onBack,
  isOwnProfile,
  isFollowing,
  onToggleFollow,
  reloadKey,
  currentUserFollowing,
}: ProfilePageProps) {
  const [info, setInfo] = useState<ProfileInfo | null>(null);
  const [followersDisplay, setFollowersDisplay] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${LOCAL_URL}/user/get/${profile.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          throw new Error("Unable to load profile");
        }
        const json = await res.json();
        const rawUser = json?.data?.user;
        if (!rawUser) {
          throw new Error("User not found");
        }

        const normalizedId = normalizeId(rawUser.id ?? profile.id);
        const username = rawUser.username ?? profile.username ?? `user_${normalizedId.slice(-4)}`;
        const followers = rawUser.followers ?? 0;
        const following = rawUser.following ?? 0;
        const reactions = rawUser.reactions ?? 0;
        const rawPosts: any[] = Array.isArray(rawUser.posts) ? rawUser.posts : [];

        let avatar = DEFAULT_AVATAR(username);
        const postImages: string[] = [];

        const postIds = rawPosts.map(normalizeId).filter(Boolean);
        for (const postId of postIds) {
          try {
            const postRes = await fetch(`${LOCAL_URL}/post/get/me`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
            if (!postRes.ok) continue;
            const postJson = await postRes.json();
            const imgData = postJson?.data?.post?.imgData;
            if (imgData && typeof imgData === "string") {
              if (postImages.length === 0) {
                avatar = imgData;
              }
              postImages.push(imgData);
            }
          } catch (err) {
            console.error("Failed to fetch post", postId, err);
          }
        }

        if (isMounted) {
          setInfo({
            id: normalizedId,
            username,
            followers,
            following,
            reactions,
            avatar,
            posts: postImages,
          });
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err?.message ?? "Unable to load profile");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [authToken, profile.id, profile.username, reloadKey]);

  useEffect(() => {
    if (info) {
      setFollowersDisplay(info.followers + (isFollowing ? 1 : 0));
    }
  }, [info, isFollowing]);

  const stats = useMemo(() => {
    if (!info) {
      return {
        posts: 0,
        followers: "0",
        following: "0",
        reactions: "0",
      };
    }

    const followingCount = isOwnProfile && currentUserFollowing !== undefined
      ? currentUserFollowing
      : info.following;

    return {
      posts: info.posts.length,
      followers: followersDisplay.toLocaleString(),
      following: followingCount.toLocaleString(),
      reactions: info.reactions.toLocaleString(),
    };
  }, [info, followersDisplay, isOwnProfile, currentUserFollowing]);

  const handleFollowToggle = () => {
    if (!info) return;
    onToggleFollow(info.id, !isFollowing);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-900/70 bg-black/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-lg font-semibold tracking-tight">
              {info?.username ?? profile.username ?? "Profile"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 flex flex-col items-center gap-4 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            Loading profile...
          </div>
        ) : error ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-red-400">
            {error}
          </div>
        ) : info ? (
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-black px-6 py-8">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-16 top-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
              </div>

              <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left sm:gap-8">
                <img
                  src={info.avatar}
                  alt={info.username}
                  className="h-28 w-28 rounded-full object-cover border-4 border-gray-900 shadow-lg"
                />
                <div className="flex-1 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-white">{info.username}</h1>
                      {isOwnProfile ? (
                        <p className="text-sm text-gray-400">This is your profile</p>
                      ) : (
                        <p className="text-sm text-gray-400">Explore {info.username}'s real moments</p>
                      )}
                    </div>
                    {isOwnProfile ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="rounded-full border border-gray-800 px-3 py-1 uppercase tracking-wide">Owner</span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleFollowToggle}
                        variant={isFollowing ? "outline" : "default"}
                        className={`px-5 ${isFollowing ? "bg-transparent border-gray-600 text-gray-200" : "bg-white text-black"}`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                    <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{stats.posts}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Posts</p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{stats.followers}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Followers</p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3">
                      <p className="text-sm font-semibold text-white">{stats.following}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Following</p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 leading-relaxed">
                    <p>Total reactions received: <span className="font-medium text-gray-200">{stats.reactions}</span></p>
                    {!isOwnProfile && (
                      <p className="mt-1 text-xs text-gray-500">
                        Following lets you see {info.username}'s updates in your home feed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Posts</h2>
                <span className="text-xs text-gray-500">{stats.posts} total</span>
              </div>
              {info.posts.length === 0 ? (
                <div className="px-6 py-20 text-center text-sm text-gray-400">
                  {isOwnProfile ? (
                    <div className="space-y-3">
                      <p className="text-base text-white">You haven't shared anything yet.</p>
                      <p>Tap the Upload button above to post your first be4real moment.</p>
                    </div>
                  ) : (
                    <p>No posts yet.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-black/60">
                  {info.posts.map((img, index) => (
                    <div
                      key={`${info.id}-post-${index}`}
                      className="relative aspect-square overflow-hidden bg-gray-950"
                    >
                      <img
                        src={img}
                        alt={`Post ${index + 1}`}
                        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

