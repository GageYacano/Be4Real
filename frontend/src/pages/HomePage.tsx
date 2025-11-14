import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000"; 

interface HomePageProps {
  authToken: string;
  onViewProfile?: (profile: { id: string; username?: string }) => void;
  reloadKey: number;
}

type FeedPost = {
  id: string;
  image: string;
  userId: string;
  username: string;
  avatar: string;
  postedAt: string;
  reactionCount: number;
  reactions: Record<string, number>;
};

type FeedUser = {
  id: string;
  username: string;
  followers: number;
  following: number;
  avatar: string;
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

function formatTimeAgo(timestamp: number) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}

const DEFAULT_AVATAR = (username?: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username ?? "be4real")}`;

export function HomePage({ authToken, onViewProfile, reloadKey }: HomePageProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [users, setUsers] = useState<Record<string, FeedUser>>({});
  const usersRef = useRef<Record<string, FeedUser>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { id: string; text: string; timestamp: number }[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUser = useCallback(
    async (userId: string, avatarFallback?: string): Promise<FeedUser | null> => {
      try {
        const cached = usersRef.current[userId];
        if (cached) {
          return cached;
        }

        const res = await fetch(`${LOCAL_URL}/user/get/${userId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          return null;
        }
        const json = await res.json();
        const rawUser = json?.data?.user ?? {};
        const normalizedId = normalizeId(rawUser.id ?? userId);
        const username = rawUser.username ?? `user_${normalizedId.slice(-4)}`;
        const followers = rawUser.followers ?? 0;
        const following = rawUser.following ?? 0;

        let avatar = avatarFallback ?? DEFAULT_AVATAR(username);

        const rawPosts: any[] = Array.isArray(rawUser.posts) ? rawUser.posts : [];
        if (rawPosts.length > 0) {
          const firstPostId = normalizeId(rawPosts[0]);
          if (firstPostId) {
            const postRes = await fetch(`${LOCAL_URL}/post/get/${firstPostId}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            if (postRes.ok) {
              const postJson = await postRes.json();
              const imgData = postJson?.data?.post?.imgData;
              if (imgData && typeof imgData === "string") {
                avatar = imgData;
              }
            }
          }
        }

        const profile: FeedUser = {
          id: normalizedId,
          username,
          followers,
          following,
          avatar,
        };
        usersRef.current[normalizedId] = profile;
        return profile;
      } catch (err) {
        console.error("Failed to fetch user:", err);
        return null;
      }
    },
    [authToken]
  );

  const fetchFeed = useCallback(async () => {
    setError(null);
    setIsRefreshing(true);
    try {
      const res = await fetch(`${LOCAL_URL}/post/get-feed?limit=20`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Unable to load feed");
      }
      const json = await res.json();
      const rawPosts: any[] = json?.data?.posts ?? [];

      const fallbackAvatars = new Map<string, string>();
      const uniqueUserIds = new Set<string>();

      rawPosts.forEach((post) => {
        const userId = normalizeId(post.user);
        if (!userId) return;
        uniqueUserIds.add(userId);
        if (!fallbackAvatars.has(userId) && typeof post.imgData === "string") {
          fallbackAvatars.set(userId, post.imgData);
        }
      });

      const userEntries = await Promise.all(
        Array.from(uniqueUserIds).map(async (userId) => fetchUser(userId, fallbackAvatars.get(userId)))
      );

      let userMap: Record<string, FeedUser> = { ...usersRef.current };
      userEntries.forEach((entry) => {
        if (entry) {
          userMap = {
            ...userMap,
            [entry.id]: entry,
          };
        }
      });
      usersRef.current = userMap;

      const transformed: FeedPost[] = rawPosts.map((post) => {
        const postId = normalizeId(post._id);
        const userId = normalizeId(post.user);
        const user = userMap[userId];
        const reactionEntries = Object.entries(post.reactions ?? {}) as Array<[string, number]>;
        const reactionCount = reactionEntries.reduce((sum, [, count]) => sum + (count ?? 0), 0);
        return {
          id: postId,
          image: post.imgData ?? "",
          userId,
          username: user?.username ?? `user_${userId.slice(-4)}`,
          avatar: user?.avatar ?? fallbackAvatars.get(userId) ?? DEFAULT_AVATAR(user?.username),
          postedAt: formatTimeAgo(post.ctime ?? Date.now()),
          reactionCount,
          reactions: post.reactions ?? {},
        };
      });

      setUsers(userMap);
      setPosts(transformed);
      setLikedPosts((prev) => {
        const next: Record<string, boolean> = {};
        transformed.forEach((post) => {
          if (prev[post.id]) {
            next[post.id] = true;
          }
        });
        return next;
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Unable to load feed");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authToken, fetchUser]);

  useEffect(() => {
    setIsLoading(true);
    fetchFeed();
  }, [fetchFeed, reloadKey]);

  // ---- Minimal addition: handle reactions ----
  const handleReact = useCallback(async (postId: string, emoji: string) => {
    // optimistic update
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              reactions: { ...p.reactions, [emoji]: (p.reactions[emoji] ?? 0) + 1 },
              reactionCount: p.reactionCount + 1,
            }
          : p
      )
    );

    try {
      const res = await fetch(`${LOCAL_URL}/post/react/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reaction: emoji }),
      });

      if (!res.ok) {
        // rollback on failure
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? {
                  ...p,
                  reactions: {
                    ...p.reactions,
                    [emoji]: Math.max(0, (p.reactions[emoji] ?? 1) - 1),
                  },
                  reactionCount: Math.max(0, p.reactionCount - 1),
                }
              : p
          )
        );
      }
    } catch (e) {
      // rollback on error
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? {
                ...p,
                reactions: {
                  ...p.reactions,
                  [emoji]: Math.max(0, (p.reactions[emoji] ?? 1) - 1),
                },
                reactionCount: Math.max(0, p.reactionCount - 1),
              }
            : p
        )
      );
    }
  }, [authToken]);
  // -------------------------------------------

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      {isLoading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-gray-400">
          Loading your feed...
        </div>
      ) : error ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-red-400">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-gray-400">
          Your feed is empty. Share your first post!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            return (
                <div key={post.id}>
                    <div className="rounded-2xl outline-gray-700 outline-1 overflow-hidden">
                        <div className="h-14 p-3 flex gap-3 items-center w-full">
                            <div className="w-10 flex-none aspect-square rounded-full outline-gray-700 outline-1 overflow-hidden">
                                <img src={post.avatar} className="object-cover w-full h-full" />
                            </div>
                            <div className="font-semibold text-white">{post.username}</div>
                        </div>
                        <div className="aspect-square">
                            <img src={post.image} className="object-cover w-full h-full"/>
                        </div>
                    </div>
                    <div className="w-full py-3 flex flex-wrap gap-2">
                       {Object.entries(post.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(post.id, emoji)}
                            className="px-3 py-1 bg-gray-800 rounded-full border border-gray-700 hover:bg-gray-700 cursor-pointer text-white text-sm"
                          >
                            {emoji} {count}
                          </button>
                        ))}
                    </div>
                </div>
            );
          })}

          <div className="text-center">
            <Button
              variant="outline"
              onClick={fetchFeed}
              disabled={isRefreshing}
              className="text-sm border-gray-700 text-white hover:bg-gray-800 hover:text-white"
            >
              {isRefreshing ? "Refreshing..." : "Refresh feed"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
