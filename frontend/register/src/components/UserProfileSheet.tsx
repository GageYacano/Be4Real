import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { User } from "./HomePage";
import { UserPlus, X } from "lucide-react";

interface UserProfileSheetProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileSheet({ user, isOpen, onClose }: UserProfileSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-gray-900 border-gray-800 text-white w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">Profile</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-24 h-24 border-4 border-white mb-4">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl mb-2">{user.name}</h2>
            <p className="text-gray-400 mb-4">{user.bio}</p>
          </div>

          {/* Stats */}
          <div className="flex justify-around py-4 bg-gray-800 rounded-xl">
            <div className="text-center">
              <p className="text-2xl mb-1">{user.posts}</p>
              <p className="text-sm text-gray-400">Posts</p>
            </div>
            <div className="w-px bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl mb-1">{user.friends}</p>
              <p className="text-sm text-gray-400">Friends</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button className="w-full bg-white text-black hover:bg-gray-200 rounded-xl h-11">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-700 text-white hover:bg-gray-800 rounded-xl h-11"
            >
              Send Message
            </Button>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm text-gray-400 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm">Posted 2 hours ago</p>
              </div>
              <div className="p-3 bg-gray-800 rounded-lg">
                <p className="text-sm">Added 3 new friends this week</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
