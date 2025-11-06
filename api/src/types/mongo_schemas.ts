
import { ObjectId } from "mongodb"

interface DBUser {
    _id?: ObjectId;
    ctime: number;
    loginMethod: "password" | "google";
    username: string;
    email: string;
    passHash: string | null;
    verified: boolean;
    verifCode: string | null;
    posts: ObjectId[];
    followers: number;
    following: number;
    reactions: number;
}

interface DBPost {
    _id?: ObjectId;
    ctime: number;
    imgData: string;
    user: ObjectId;
    reactions: {
        [key: string]: number
    };
}

interface DBReaction {
    _id?: ObjectId;
    post: ObjectId;
    user: ObjectId;
    reaction: string;
    ctime: number;
}

export { DBUser, DBPost, DBReaction };