import { useState } from "react";

const SERVER_URL = "http://bef4real.life/api";
const LOCAL_URL = "http://localhost:3000";

interface PostProps {
  postId: string;
  uid: string;
  userId: string;
  username: string;
  profile: string;
  image: string;
  time: string;
  reactions: {
    [key: string]: Set<string>;
  };
}

function Post({
  data,
  onViewProfile,
}: {
  data: PostProps;
  onViewProfile?: (profile: { id: string; username?: string }) => void;
}) {
  const [reactions, setReactions] = useState(data.reactions);

  const handleReact = async (emoji: string) => {
    // decide action based on current state (before updating)
    const currentSet = reactions[emoji] ?? new Set<string>();
    const willRemove = currentSet.has(data.uid);

    // immutable state update: clone Set and object
    setReactions((prev) => {
      const prevSet = prev[emoji] ?? new Set<string>();
      const nextSet = new Set(prevSet);
      if (willRemove) nextSet.delete(data.uid);
      else nextSet.add(data.uid);
      return { ...prev, [emoji]: nextSet };
    });

    console.log(willRemove)
    // update db
    await fetch(`${LOCAL_URL}/post/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify({
        postId: data.postId,
        reaction: emoji,
        removeReaction: willRemove,
      }),
    });
  };

  return (
    <div key={data.postId}>
      <div className="rounded-2xl outline-gray-700 outline-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() =>
              onViewProfile?.({ id: data.userId, username: data.username })
            }
            className="h-14 px-3 flex gap-3 items-center w-full text-left hover:bg-white/5 transition-colors"
          >
            <div className="w-10 flex-none aspect-square rounded-full outline-gray-700 outline-1 overflow-hidden">
              <img
                src={data.profile}
                className="object-cover w-full h-full"
                alt={`${data.username} avatar`}
              />
            </div>
            <div>
              <div className="font-semibold text-white leading-tight">
                {data.username}
              </div>
              <div className="text-xs text-gray-500">{data.time} ago</div>
            </div>
          </button>
          <div className="text-sm text-gray-400 px-4 hidden sm:block">
            {data.time} ago
          </div>
        </div>
        <div className="aspect-square">
          <img src={data.image} className="object-cover w-full h-full" />
        </div>
      </div>
      <div className="w-full py-3 flex flex-wrap justify-between">
        {Object.entries(reactions).map(([emoji, userSet]) => {
          const hasReacted = userSet?.has(data.uid) ?? false;
          const count = userSet?.size ?? 0;

          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className={`px-2 py-1 rounded-full border border-gray-600 text-white text-sm cursor-pointer
                ${hasReacted ? "bg-gray-700" : "bg-gray-900"} hover:bg-gray-700`}
            >
              {emoji} {count}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { PostProps, Post };
