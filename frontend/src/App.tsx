import React, { useState, useEffect, useCallback, useRef } from "react";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { Button } from "./components/ui/button";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000";

type View = "login" | "register" | "home" | "profile";

type SelectedProfile = {
  id: string;
  username?: string;
};

type CurrentUser = {
  id: string;
  username: string;
  followers: number;
  following: number;
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>("login");
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [feedReloadKey, setFeedReloadKey] = useState(0);
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [scrollPosition, setScrollPosition] = useState({
  top: false,
  bottom: false,
});


  // 👇 this is the actual scroll container
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const fetchCurrentUser = useCallback(
    async (token: string) => {
      try {
        const res = await fetch(`${LOCAL_URL}/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Unable to load user");

        const json = await res.json();
        const userData = json?.user;
        if (!userData) throw new Error("User data missing");

        const mapped: CurrentUser = {
          id: normalizeId(userData.id ?? userData._id ?? ""),
          username: userData.username ?? "user",
          followers: userData.followers ?? 0,
          following: userData.following ?? 0,
        };

        setCurrentUser(mapped);
        setSelectedProfile({ id: mapped.id, username: mapped.username });
        setCurrentView("home");
      } catch (err) {
        console.error(err);
        localStorage.removeItem("authToken");
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentView("login");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyToken = useCallback(
    async (token: string) => {
      try {
        await fetchCurrentUser(token);
        setAuthToken(token);
      } catch {
        localStorage.removeItem("authToken");
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentView("login");
        setIsLoading(false);
      }
    },
    [fetchCurrentUser]
  );

  // ✅ Effect 1: verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      setCurrentView("login");
      return;
    }
    verifyToken(token);
  }, [verifyToken]);

  const applyToken = useCallback(
    async (token: string) => {
      localStorage.setItem("authToken", token);
      setAuthToken(token);
      setIsLoading(true);
      await fetchCurrentUser(token);
    },
    [fetchCurrentUser]
  );

  const handleLoginSuccess = (token: string) => {
    void applyToken(token);
  };

  const handleRegisterSuccess = (token: string) => {
    void applyToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setAuthToken(null);
    setCurrentUser(null);
    setSelectedProfile(null);
    setFollowingMap({});
    setFeedReloadKey(0);
    setProfileReloadKey(0);
    setCurrentView("login");
  };

  const handleViewProfile = (profile: SelectedProfile) => {
    setSelectedProfile(profile);
    setProfileReloadKey((key) => key + 1);
    setCurrentView("profile");
  };

  const handleBackToFeed = () => {
    setSelectedProfile(null);
    setCurrentView("home");
  };

  const handleToggleFollow = useCallback((targetId: string, nextState: boolean) => {
    setFollowingMap((prev) => {
      const next = { ...prev };
      if (nextState) next[targetId] = true;
      else delete next[targetId];
      return next;
    });
    setCurrentUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        following: Math.max(0, prev.following + (nextState ? 1 : -1)),
      };
    });
  }, []);

  const goToHome = () => {
    setCurrentView("home");
    setSelectedProfile(null);
  };

  const goToOwnProfile = () => {
    if (!currentUser) return;
    setSelectedProfile({ id: currentUser.id, username: currentUser.username });
    setProfileReloadKey((key) => key + 1);
    setCurrentView("profile");
  };

  // ✅ Effect 2: attach scroll listener when the scroll container exists (and when view changes)
  useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 5;

    setScrollPosition({ top: atTop, bottom: atBottom });
  };

  el.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // run once to initialize

  return () => el.removeEventListener("scroll", handleScroll);
}, [currentView]);// re-attach when switching Home/Profile

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">be4real</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentView === "login") {
    return (
      <LoginPage
        onSwitchToRegister={() => setCurrentView("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentView === "register") {
    return (
      <RegisterPage
        onSwitchToLogin={() => setCurrentView("login")}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  if (!authToken || !currentUser) {
    return (
      <LoginPage
        onSwitchToRegister={() => setCurrentView("register")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const effectiveProfile: SelectedProfile = selectedProfile ?? {
    id: currentUser.id,
    username: currentUser.username,
  };
  const isOwnProfile = effectiveProfile.id === currentUser.id;
  const isFollowing = !!followingMap[effectiveProfile.id];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span
              className="text-xl font-semibold tracking-tight cursor-pointer"
              onClick={goToHome}
            >
              be4real
            </span>
            <nav className="flex items-center gap-3 text-sm text-gray-400">
              <button
                onClick={goToHome}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  currentView === "home" ? "bg-white text-black" : "hover:text-white"
                }`}
              >
                Home
              </button>
              <button
                onClick={goToOwnProfile}
                className={`px-3 py-1.5 rounded-full transition-colors ${
                  currentView === "profile" && isOwnProfile
                    ? "bg-white text-black"
                    : "hover:text-white"
                }`}
              >
                Profile
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-gray-300 hover:text-white"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* 👇 Make this the scroll container */}
      <main
        ref={scrollRef}
        className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12 h-screen overflow-y-auto"
      >
        {currentView === "profile" ? (
          <ProfilePage
            authToken={authToken}
            profile={effectiveProfile}
            onBack={handleBackToFeed}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onToggleFollow={handleToggleFollow}
            reloadKey={profileReloadKey}
            currentUserFollowing={currentUser.following}
          />
        ) : (
          <HomePage
            currentUserId={currentUser.id}
            authToken={authToken}
            onViewProfile={handleViewProfile}
            reloadKey={feedReloadKey}
            scrolledTop={scrollPosition.top}
            scrolledBottom={scrollPosition.bottom}
        />
        )}
      </main>
    </div>
  );
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
