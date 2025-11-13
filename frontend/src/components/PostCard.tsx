import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Smile } from "lucide-react";
import { Post } from "./HomePage";

interface PostCardProps {
  post: Post;
  onReaction: (postId: string, emoji: string) => void;
  onUserClick: (userId: string) => void;
}

const EMOJI_OPTIONS = ["😂", "❤️", "🔥", "👍", "😮", "😢", "🎉", "💯"];

export function PostCard({ post, onReaction, onUserClick }: PostCardProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
      {/* User Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => onUserClick(post.userId)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage src={post.userAvatar} alt={post.userName} />
            <AvatarFallback>{post.userName[0]}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-white">{post.userName}</p>
            <p className="text-sm text-gray-400">{post.timestamp}</p>
          </div>
        </button>
      </div>

      {/* Post Image */}
      <div className="relative aspect-square bg-black">
        <ImageWithFallback
          src={post.imageUrl}
          alt={`Post by ${post.userName}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Reactions Bar */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {post.reactions.map((reaction, index) => (
            <button
              key={index}
              onClick={() => onReaction(post.id, reaction.emoji)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                post.userReaction === reaction.emoji
                  ? "bg-white text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              <span className="text-lg">{reaction.emoji}</span>
              <span className="text-sm">{reaction.count}</span>
            </button>
          ))}
        </div>

        {/* Add Reaction Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Smile className="w-4 h-4 mr-2" />
            Add Reaction
          </Button>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="absolute left-0 top-full mt-2 bg-gray-800 rounded-xl p-3 flex gap-2 shadow-lg border border-gray-700 z-10">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(post.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
