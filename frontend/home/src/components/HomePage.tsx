import { useState } from "react";
import { PostCard } from "./PostCard";
import { UserProfileSheet } from "./UserProfileSheet";
import { Bell, Camera } from "lucide-react";
import { Button } from "./ui/button";

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  timestamp: string;
  reactions: { emoji: string; count: number }[];
  userReaction?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  posts: number;
  friends: number;
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    userId: "user1",
    userName: "Sarah Chen",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    imageUrl: "https://images.unsplash.com/photo-1758524941980-4245cc149fe4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBzZWxmaWUlMjBtb21lbnR8ZW58MXx8fHwxNzYxMDEwNDUzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "2m ago",
    reactions: [
      { emoji: "😂", count: 12 },
      { emoji: "❤️", count: 8 },
    ],
  },
  {
    id: "2",
    userId: "user2",
    userName: "Mike Johnson",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    imageUrl: "https://images.unsplash.com/photo-1518057111178-44a106bad636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBtb3JuaW5nfGVufDF8fHx8MTc2MTAwOTY2OHww&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "15m ago",
    reactions: [
      { emoji: "☕", count: 15 },
      { emoji: "👍", count: 5 },
    ],
  },
  {
    id: "3",
    userId: "user3",
    userName: "Emma Davis",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    imageUrl: "https://images.unsplash.com/photo-1701664368345-e3bec90acd53?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrc3BhY2UlMjBkZXNrfGVufDF8fHx8MTc2MDk0MzE2OHww&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "42m ago",
    reactions: [
      { emoji: "💻", count: 9 },
      { emoji: "🔥", count: 6 },
    ],
  },
  {
    id: "4",
    userId: "user4",
    userName: "Alex Rivera",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    imageUrl: "https://images.unsplash.com/photo-1714670157300-eabdb11c7499?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwbmF0dXJlfGVufDF8fHx8MTc2MTAxMDQ1NHww&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "1h ago",
    reactions: [
      { emoji: "🌲", count: 20 },
      { emoji: "😍", count: 14 },
    ],
  },
  {
    id: "5",
    userId: "user5",
    userName: "Jordan Kim",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    imageUrl: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRzJTIwaGFuZ2luZyUyMG91dHxlbnwxfHx8fDE3NjA5NDk3OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "2h ago",
    reactions: [
      { emoji: "🎉", count: 18 },
      { emoji: "❤️", count: 22 },
    ],
  },
  {
    id: "6",
    userId: "user6",
    userName: "Taylor Wong",
    userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    imageUrl: "https://images.unsplash.com/photo-1650057861788-b6b8606b77ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlcnNvbnxlbnwxfHx8fDE3NjA5OTk1OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    timestamp: "3h ago",
    reactions: [
      { emoji: "✨", count: 11 },
      { emoji: "😊", count: 7 },
    ],
  },
];

const MOCK_USERS: { [key: string]: User } = {
  user1: {
    id: "user1",
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    bio: "Coffee enthusiast ☕ | Design lover 🎨",
    posts: 142,
    friends: 387,
  },
  user2: {
    id: "user2",
    name: "Mike Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    bio: "Always exploring new coffee spots",
    posts: 98,
    friends: 256,
  },
  user3: {
    id: "user3",
    name: "Emma Davis",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    bio: "Product designer working remotely 💻",
    posts: 215,
    friends: 503,
  },
  user4: {
    id: "user4",
    name: "Alex Rivera",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    bio: "Nature photographer 📸 | Hiker",
    posts: 324,
    friends: 621,
  },
  user5: {
    id: "user5",
    name: "Jordan Kim",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    bio: "Living my best life with amazing friends",
    posts: 187,
    friends: 445,
  },
  user6: {
    id: "user6",
    name: "Taylor Wong",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
    bio: "Just being real ✌️",
    posts: 156,
    friends: 392,
  },
};

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleReaction = (postId: string, emoji: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const existingReaction = post.reactions.find((r) => r.emoji === emoji);
        const hadUserReaction = post.userReaction === emoji;

        let newReactions = [...post.reactions];

        if (hadUserReaction) {
          // Remove reaction
          newReactions = newReactions
            .map((r) =>
              r.emoji === emoji ? { ...r, count: r.count - 1 } : r
            )
            .filter((r) => r.count > 0);
          return { ...post, reactions: newReactions, userReaction: undefined };
        } else {
          // Add or change reaction
          if (post.userReaction) {
            // Remove old reaction
            newReactions = newReactions
              .map((r) =>
                r.emoji === post.userReaction
                  ? { ...r, count: r.count - 1 }
                  : r
              )
              .filter((r) => r.count > 0);
          }

          // Add new reaction
          if (existingReaction) {
            newReactions = newReactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            );
          } else {
            newReactions.push({ emoji, count: 1 });
          }

          return { ...post, reactions: newReactions, userReaction: emoji };
        }
      })
    );
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileOpen(true);
  };

  const selectedUser = selectedUserId ? MOCK_USERS[selectedUserId] : null;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black" style={{ width: '1440px', height: '1024px' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-2xl">be4real</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
            >
              <Camera className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800"
            >
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Feed */}
      <div className="h-full pt-16 pb-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onReaction={handleReaction}
              onUserClick={handleUserClick}
            />
          ))}
        </div>
      </div>

      {/* User Profile Sheet */}
      {selectedUser && (
        <UserProfileSheet
          user={selectedUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      )}
    </div>
  );
}
