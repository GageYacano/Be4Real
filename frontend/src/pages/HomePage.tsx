import { useCallback, useEffect, useRef, useState } from "react";
import { Post, PostProps } from "../components/Post";

const SERVER_URL = "http://be4real.life/api";
const LOCAL_URL =  SERVER_URL//"http://localhost:3000";

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
  const [hasMore, setHasMore] = useState(true);

  // Stable refs to prevent races and dupes
  const fetchingRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const userCacheRef = useRef<Map<string, FeedUser>>(new Map());
  const postsRef = useRef<PostProps[]>([]);

  // Keep postsRef in sync with posts state
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const fetchUser = useCallback(
    async (rawUserId: string): Promise<FeedUser> => {
      const userId = normalizeId(rawUserId);
      const cache = userCacheRef.current;
      if (cache.has(userId)) return cache.get(userId)!;

      const r = await fetch(`${LOCAL_URL}/user/get/${userId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const j = await r.json();
      const u = j?.data?.user ?? {};
      
      let profileImg = "/assets/default-pfp.png";
      if (u.posts) {
        const res = await fetch(`${LOCAL_URL}/post/get/${u.posts[0]}`)
      }

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
      const normalizedUserId = normalizeId(raw.user);
      const user = await fetchUser(normalizedUserId);
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
        userId: user.id,
        image: raw.imgData,
        time: formatTimeAgo(raw.ctime),
        reactions,
      };
    },
    [currentUserId, fetchUser]
  );

  const fetchFeed = useCallback(
    async (direction: "init" | "newer" | "older" = "init") => {
      if (fetchingRef.current) {
        console.log(`[BLOCKED] Already fetching, direction: ${direction}`);
        return;
      }
      
      fetchingRef.current = true;
      setError(null);
      setIsRefreshing(direction !== "init");

      try {
        let url = `${LOCAL_URL}/post/get-feed?limit=5`;
        
        // Use ref to get current cursor values
        const currentPosts = postsRef.current;
        
        if (direction === "newer") {
          const after = currentPosts[0]?.postId;
          if (after) {
            url += `&after=${after}`;
            console.log(`[NEWER] Requesting posts after: ${after}`);
          }
        } else if (direction === "older") {
          const before = currentPosts[currentPosts.length - 1]?.postId;
          if (before) {
            url += `&before=${before}`;
            console.log(`[OLDER] Requesting posts before: ${before}`);
          } else {
            console.log(`[OLDER] No cursor available, skipping`);
            fetchingRef.current = false;
            setIsRefreshing(false);
            return;
          }
        }

        console.log(`[FETCH] ${direction.toUpperCase()} - URL: ${url}`);
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        
        if (!res.ok) throw new Error("Unable to load feed");

        const json = await res.json();
        const rawPosts: any[] = json?.data?.posts ?? [];
        console.log(`[${direction.toUpperCase()}] Received ${rawPosts.length} raw posts`);

        // Convert and de-dupe by ID
        const next: PostProps[] = [];
        for (const raw of rawPosts) {
          const id = normalizeId(raw._id ?? raw.postId);
          if (!id) continue;
          if (seenIdsRef.current.has(id)) {
            console.log(`[DUPE] Skipping already seen post: ${id}`);
            continue;
          }
          const p = await mapRawToPost(raw);
          next.push(p);
        }

        console.log(`[${direction.toUpperCase()}] Adding ${next.length} new posts after dedup`);

        // Check if we've reached the end
        if (direction === "older" && next.length < 5) {
          console.log(`[OLDER] Reached end of feed`);
          setHasMore(false);
        }

        if (next.length) {
          // Record new IDs before setState to avoid races
          next.forEach(p => seenIdsRef.current.add(p.postId));
          
          setPosts(prev => {
            if (direction === "older") {
              console.log(`[OLDER] Appending ${next.length} posts to ${prev.length} existing`);
              return [...prev, ...next];
            }
            // "init" and "newer" should prepend (API returns newest first)
            console.log(`[${direction.toUpperCase()}] Prepending ${next.length} posts to ${prev.length} existing`);
            return [...next, ...prev];
          });
        } else {
          console.log(`[${direction.toUpperCase()}] No new posts to add`);
          if (direction === "older") {
            setHasMore(false);
          }
        }
      } catch (e: any) {
        console.error(`[ERROR] ${direction}:`, e);
        setError(e?.message ?? "Unable to load feed");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        fetchingRef.current = false;
        console.log(`[DONE] ${direction.toUpperCase()} fetch complete`);
      }
    },
    [authToken, mapRawToPost]
  );

  // Initial load + reloadKey changes
  useEffect(() => {
    console.log(`[INIT] Reload key changed: ${reloadKey}`);
    // reset state on reloadKey change
    setPosts([]);
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    seenIdsRef.current.clear();
    userCacheRef.current.clear();

    fetchFeed("init");
  }, [reloadKey, fetchFeed]);

  // Polling for new posts when at top
  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    
    if (!scrolledTop) return;
    
    // poll every 3 seconds when at top
    pollRef.current = window.setInterval(() => {
      if (!fetchingRef.current) {
        console.log(`[POLL] Checking for new posts`);
        fetchFeed("newer");
      }
    }, 3000) as unknown as number;

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [fetchFeed, scrolledTop]);

  // Load older posts when scrolled to bottom
  useEffect(() => {
    if (scrolledBottom && !fetchingRef.current && hasMore) {
      console.log(`[SCROLL] Bottom reached, loading older posts`);
      fetchFeed("older");
    }
  }, [scrolledBottom, fetchFeed, hasMore]);

  // Load newer posts when scrolled to top
  useEffect(() => {
    if (scrolledTop && !fetchingRef.current) {
      console.log(`[SCROLL] Top reached, loading newer posts`);
      fetchFeed("newer");
    }
  }, [scrolledTop, fetchFeed]);

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
            <Post
              key={post.postId}
              data={post}
              onViewProfile={onViewProfile}
            />
          ))}
          {!hasMore && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-8 text-center text-gray-500 text-sm">
              You've reached the end
            </div>
          )}
        </div>
      )}
    </div>
  );
}