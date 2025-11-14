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
  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(
    username ?? "be4real"
  )}&size=128`;

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
        const username =
          rawUser.username ??
          profile.username ??
          `user_${normalizedId.slice(-4)}`;
        const followers = rawUser.followers ?? 0;
        const following = rawUser.following ?? 0;
        const reactions = rawUser.reactions ?? 0;
        const rawPosts: any[] = Array.isArray(rawUser.posts)
          ? rawUser.posts
          : [];

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

    const followingCount =
      isOwnProfile && currentUserFollowing !== undefined
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
      {/* TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-gray-900/80 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold tracking-tight sm:text-lg">
            {info?.username ?? profile.username ?? "Profile"}
          </span>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 px-8 py-16 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            Loading profile...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 px-8 py-16 text-center text-red-400">
            {error}
          </div>
        ) : info ? (
          <div className="space-y-8">
            {/* PROFILE HEADER */}
            <section className="rounded-2xl border border-gray-850 bg-[#050508] px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                {/* AVATAR */}
                <div className="flex justify-center sm:block">
                  <img
                    src={info.avatar}
                    alt={info.username}
                    className="h-18 w-18 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full border border-gray-700 object-cover shadow-lg"
                  />
                </div>

                {/* NAME + BUTTON + STATS */}
                <div className="flex-1 space-y-4">
                  {/* Name + follow */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {info.username}
                      </h1>
                      {isOwnProfile ? (
                        <p className="text-xs text-gray-400 sm:text-sm">
                          This is your profile
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 sm:text-sm">
                          Explore {info.username}&apos;s real moments
                        </p>
                      )}
                    </div>

                    {isOwnProfile ? (
                      <div className="flex items-center justify-start gap-2 text-[11px] text-gray-500 sm:justify-end sm:text-xs">
                        <span className="rounded-full border border-gray-700 px-3 py-1 uppercase tracking-wide">
                          Owner
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-start sm:justify-end">
                        <Button
                          onClick={handleFollowToggle}
                          variant={isFollowing ? "outline" : "default"}
                          className={`h-9 px-4 text-sm ${
                            isFollowing
                              ? "bg-transparent border-gray-600 text-gray-200"
                              : "bg-white text-black"
                          }`}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Compact stats row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{stats.posts}</span>
                      <span className="text-gray-400">posts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{stats.followers}</span>
                      <span className="text-gray-400">followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{stats.following}</span>
                      <span className="text-gray-400">following</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span className="text-xs uppercase tracking-wide">
                        {stats.reactions} reactions
                      </span>
                    </div>
                  </div>

                  {/* Description / hint */}
                  <div className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                    {!isOwnProfile ? (
                      <>
                        Following{" "}
                        <span className="text-gray-200">{info.username}</span>{" "}
                        lets you see their updates in your home feed.
                      </>
                    ) : (
                      <>Share your daily be4real moments with your friends.</>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* POSTS */}
            <section className="overflow-hidden rounded-2xl border border-gray-850 bg-[#050508]">
              <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-6 sm:py-3.5">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:text-sm">
                  Posts
                </h2>
                <span className="text-[11px] text-gray-500 sm:text-xs">
                  {stats.posts} total
                </span>
              </div>

              {info.posts.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-gray-400 sm:py-20">
                  {isOwnProfile ? (
                    <div className="space-y-3">
                      <p className="text-sm text-white sm:text-base">
                        You haven&apos;t shared anything yet.
                      </p>
                    </div>
                  ) : (
                    <p>No posts yet.</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-[1px] bg-black/80 sm:grid-cols-3 md:grid-cols-4">
                  {info.posts.map((img, index) => (
                    <div
                      key={`${info.id}-post-${index}`}
                      className="relative aspect-square bg-gray-950"
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
