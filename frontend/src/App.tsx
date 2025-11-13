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

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });

export default function App() {
  const [currentView, setCurrentView] = useState<View>("login");
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [feedReloadKey, setFeedReloadKey] = useState(0);
  const [profileReloadKey, setProfileReloadKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCurrentUser = useCallback(
    async (token: string) => {
      try {
        const res = await fetch(`${LOCAL_URL}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Unable to load user");
        }
        const json = await res.json();
        const userData = json?.user;
        if (!userData) {
          throw new Error("User data missing");
        }
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
        sessionStorage.removeItem("authToken");
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
        sessionStorage.removeItem("authToken");
        setAuthToken(null);
        setCurrentUser(null);
        setCurrentView("login");
        setIsLoading(false);
      }
    },
    [fetchCurrentUser]
  );

  useEffect(() => {
    localStorage.removeItem("authToken");
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      setCurrentView("login");
      return;
    }
    verifyToken(token);
  }, [verifyToken]);

  const applyToken = useCallback(
    async (token: string) => {
      sessionStorage.setItem("authToken", token);
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
    sessionStorage.removeItem("authToken");
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

  const handleToggleFollow = useCallback(
    (targetId: string, nextState: boolean) => {
      setFollowingMap((prev) => {
        const next = { ...prev };
        if (nextState) {
          next[targetId] = true;
        } else {
          delete next[targetId];
        }
        return next;
      });
      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          following: Math.max(0, prev.following + (nextState ? 1 : -1)),
        };
      });
    },
    []
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !authToken) return;
    try {
      setIsUploading(true);
      const base64 = await fileToBase64(file);
      const res = await fetch(`${LOCAL_URL}/post/make-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imgData: base64 }),
      });
      if (!res.ok) {
        throw new Error("Failed to upload post");
      }
      setFeedReloadKey((key) => key + 1);
      if (selectedProfile && currentUser && selectedProfile.id === currentUser.id) {
        setProfileReloadKey((key) => key + 1);
      }
    } catch (err) {
      console.error(err);
      alert("Unable to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={handleUploadClick}
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="border-gray-700 text-white hover:bg-gray-800 hover:text-white"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
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

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 pb-12">
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
            authToken={authToken}
            onViewProfile={handleViewProfile}
            reloadKey={feedReloadKey}
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
