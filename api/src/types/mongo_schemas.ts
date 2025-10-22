
import { ObjectId } from "mongodb"

interface DBUser {
    _id?: ObjectId;
    ctime: number;
    loginMethod: "password" | "google";
    username: string;
    email: string;
    passHash: string;
    verifCode: string;
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
    }[];
}

export { DBUser, DBPost };