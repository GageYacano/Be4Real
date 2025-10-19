
import { ObjectId } from "mongodb"

interface DBUser {
    _id?: ObjectId,
    loginMethod: "password" | "google",
    username: string,
    email: string,
    passHash: string,
    posts: ObjectId[]
    followers: number,
    following: number,
    reactions: number
}
