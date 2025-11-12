import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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

        const res = await fetch(`/api/user/get/${userId}`, {
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
            const postRes = await fetch(`/api/post/get/${firstPostId}`, {
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
      const res = await fetch("/api/post/get-feed?limit=20", {
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

  const handleToggleLike = useCallback(
    async (postId: string) => {
      try {
        const res = await fetch(`/api/post/react/${postId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reaction: "❤️" }),
        });

        if (!res.ok) {
          throw new Error("Failed to toggle like");
        }

        const data = await res.json();
        const message = String(data?.message ?? "").toLowerCase();
        const removing = message.includes("removed");
        const delta: number = removing ? -1 : 1;
        const countDelta = Number(delta);

        setLikedPosts((prev) => {
          const next = { ...prev };
          if (removing) {
            delete next[postId];
          } else {
            next[postId] = true;
          }
          return next;
        });

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id !== postId) return post;
            const currentHeartCount = Number(post.reactions["❤️"] ?? 0);
            const baseReactionCount = Number(post.reactionCount ?? 0);
            const newHeartCount = Math.max(0, currentHeartCount + countDelta);
            const newReactionCount = Math.max(0, baseReactionCount + countDelta);
            const newReactions = { ...post.reactions };
            if (newHeartCount <= 0) {
              const { ["❤️"]: _removed, ...rest } = newReactions;
              return { ...post, reactionCount: newReactionCount, reactions: rest };
            }
            newReactions["❤️"] = newHeartCount;
            return { ...post, reactionCount: newReactionCount, reactions: newReactions };
          })
        );
      } catch (err) {
        console.error("Failed to toggle like", err);
      }
    },
    [authToken]
  );

  const handleAddComment = useCallback(
    (postId: string) => {
      const draft = (commentDrafts[postId] ?? "").trim();
      if (!draft) return;

      const newComment = {
        id: `${postId}-${Date.now()}`,
        text: draft,
        timestamp: Date.now(),
      };

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));

      setCommentDrafts((prev) => ({
        ...prev,
        [postId]: "",
      }));
    },
    [commentDrafts]
  );

  const handleDraftChange = useCallback((postId: string, value: string) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
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
            const isLiked = likedPosts[post.id] ?? false;
            const heartCount = Number(post.reactions["❤️"] ?? 0);
            const postComments = comments[post.id] ?? [];
            const draft = commentDrafts[post.id] ?? "";

            return (
              <article key={post.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <header className="flex items-center gap-3 px-5 py-4">
                  <button
                    onClick={() => onViewProfile?.({ id: post.userId, username: post.username })}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={post.avatar}
                      alt={post.username}
                      className="w-11 h-11 rounded-full object-cover border border-gray-700"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{post.username}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{post.postedAt}</p>
                    </div>
                  </button>
                </header>

                <div className="bg-black">
                  <img
                    src={post.image}
                    alt={`${post.username}'s post`}
                    className="w-full object-cover max-h-[520px]"
                  />
                </div>

                <footer className="px-5 py-4 space-y-4">
                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`hover:text-white transition-colors ${isLiked ? "text-red-500" : ""}`}
                        aria-pressed={isLiked}
                      >
                        <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      </button>
                      <button className="hover:text-white">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <button className="hover:text-white">
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-100">
                    <p className="font-semibold">
                      {heartCount} {heartCount === 1 ? "like" : "likes"}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                      {Object.entries(post.reactions).map(([emoji, count]) => (
                        <span
                          key={emoji}
                          className="px-3 py-1 bg-gray-800 rounded-full border border-gray-700"
                        >
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {postComments.length > 0 && (
                    <div className="space-y-1.5 text-xs text-gray-200">
                      {postComments.slice(-4).map((comment) => (
                        <div key={comment.id} className="flex items-start gap-2">
                          <span className="font-semibold text-white">You</span>
                          <span className="text-gray-300">{comment.text}</span>
                          <span className="ml-auto text-gray-500">
                            {formatTimeAgo(comment.timestamp)}
                          </span>
                        </div>
                      ))}
                      {postComments.length > 4 && (
                        <p className="text-[11px] text-gray-500">View all {postComments.length} comments</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={draft}
                      onChange={(event) => handleDraftChange(post.id, event.target.value)}
                      placeholder="Add a comment..."
                      className="bg-gray-950 border border-gray-800 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-blue-400 hover:text-blue-300"
                      disabled={!draft.trim()}
                      onClick={() => handleAddComment(post.id)}
                    >
                      Post
                    </Button>
                  </div>
                </footer>
              </article>
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
