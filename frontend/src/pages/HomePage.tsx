import { useCallback, useEffect, useRef, useState } from "react";
import { Post, PostProps } from "../components/Post";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000";

interface HomePageProps {
  authToken: string;
  currentUserId: string;
  onViewProfile?: (profile: { id: string; username?: string }) => void;
  reloadKey: number;
  scrolledTop: boolean;
  scrolledBottom: boolean;
}

interface FeedUser {
  id: string;
  username: string;
  followers: number;
  following: number;
  profileImg: string;
}

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

export function HomePage({
  authToken,
  onViewProfile,
  reloadKey,
  currentUserId,
  scrolledTop,
  scrolledBottom,
}: HomePageProps) {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stable refs to prevent races and dupes
  const fetchingRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const userCacheRef = useRef<Map<string, FeedUser>>(new Map());

  const newestId = () => posts[0]?.postId ?? null;         // for ?after=
  const oldestId = () => posts[posts.length - 1]?.postId ?? null; // for &before=

  const fetchUser = useCallback(
    async (userId: string): Promise<FeedUser> => {
      const cache = userCacheRef.current;
      if (cache.has(userId)) return cache.get(userId)!;

      const r = await fetch(`${LOCAL_URL}/user/get/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const j = await r.json();
      const u = j?.data?.user ?? {};
      const mapped: FeedUser = {
        id: userId,
        username: u.username ?? `user_${String(userId).slice(-4)}`,
        followers: u.followers ?? 0,
        following: u.following ?? 0,
        profileImg: u.profileImg ?? "",
      };
      cache.set(userId, mapped);
      return mapped;
    },
    [authToken]
  );

  const mapRawToPost = useCallback(
    async (raw: any): Promise<PostProps> => {
      const user = await fetchUser(raw.user);
      const reactions: Record<string, Set<string>> = {};
      for (const emoji in (raw.reactions ?? {})) {
        reactions[emoji] = new Set(raw.reactions[emoji]);
      }
      const id = normalizeId(raw._id ?? raw.postId);
      return {
        uid: currentUserId,
        postId: id,
        profile: user.profileImg,
        username: user.username,
        image: raw.imgData,
        time: formatTimeAgo(raw.ctime),
        reactions,
      };
    },
    [currentUserId, fetchUser]
  );

  const fetchFeed = useCallback(
    async (direction: "init" | "newer" | "older" = "init") => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setError(null);
      setIsRefreshing(direction !== "init");

      try {
        let url = `${LOCAL_URL}/post/get-feed?limit=100`;
        if (direction === "newer") {
          const after = newestId();
          if (after) url += `&after=${after}`;
        } else if (direction === "older") {
          const before = oldestId();
          if (before) url += `&before=${before}`;
        }

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error("Unable to load feed");

        const json = await res.json();
        const rawPosts: any[] = json?.data?.posts ?? [];

        // Convert and de-dupe by ID
        const next: PostProps[] = [];
        for (const raw of rawPosts) {
          const id = normalizeId(raw._id ?? raw.postId);
          if (!id) continue;
          if (seenIdsRef.current.has(id)) continue; // skip dup
          const p = await mapRawToPost(raw);
          next.push(p);
        }

        if (next.length) {
          // Record new IDs before setState to avoid races on rapid polling
          next.forEach(p => seenIdsRef.current.add(p.postId));
          setPosts(prev => {
            if (direction === "older") return [...prev, ...next];
            // "init" and "newer" should prepend (API returns newest first)
            return [...next, ...prev];
          });
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Unable to load feed");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        fetchingRef.current = false;
      }
    },
    [authToken] // posts not a dep; we use refs for cursors/seen
  );

  // Initial load + reloadKey changes
  useEffect(() => {
    // reset state on reloadKey change
    setPosts([]);
    setIsLoading(true);
    setError(null);
    seenIdsRef.current.clear();
    userCacheRef.current.clear();

    fetchFeed("init");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Polling for new posts when at top
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    // poll every second only when user is at top to avoid churn
    pollRef.current = window.setInterval(() => {
      if (scrolledTop && !fetchingRef.current) {
        fetchFeed("newer");
      }
    }, 1000) as unknown as number;

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [fetchFeed, scrolledTop]);

  // Edge-triggered loads from scroll flags
  useEffect(() => {
    if (scrolledTop && !fetchingRef.current) {
      fetchFeed("newer");
    }
    if (scrolledBottom && !fetchingRef.current) {
      fetchFeed("older");
    }
  }, [scrolledTop, scrolledBottom, fetchFeed]);

  return (
    <div className="max-w-md mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      {isLoading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-gray-400">
          Loading feed...
        </div>
      ) : error ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-red-400">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-16 text-center text-gray-400">
          No post yet!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Post key={post.postId} data={post} />
          ))}
        </div>
      )}
    </div>
  );
}
