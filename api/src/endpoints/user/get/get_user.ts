import {Request, Response} from "express";
import {getDB} from "../../../utils/mongo.js";
import {DBUser, DBPost} from "../../../types/mongo_schemas.js";
import {ObjectId, Collection} from "mongodb";
import {getJWT, checkJWT} from "../../../utils/jwt.js";

async function findUserById(usersColl: Collection<DBUser>, identifier: string): Promise<DBUser | null> {
    if (!ObjectId.isValid(identifier)) return null;
    return await usersColl.findOne({_id: new ObjectId(identifier)});
}

async function findUserByPostId(usersColl: Collection<DBUser>, postsColl: Collection<DBPost>, identifier: string): Promise<DBUser | null> {
    if (!ObjectId.isValid(identifier)) return null;
    const post = await postsColl.findOne({_id: new ObjectId(identifier)});
    if (!post) return null;
    return await usersColl.findOne({_id: post.user});
}

async function findUserByUsername(usersColl: Collection<DBUser>, identifier: string): Promise<DBUser | null> {
    return await usersColl.findOne({username: identifier});
}

/**
 * Gets a user by user ID, post ID, or username.
 * Returns public user data by default.
 * If authenticated and viewing own profile, returns public and private data.
 *
 * @param req.params.identifier - user ID, post ID, or username
 * @param req.headers.authorization - OPTIONAL JWT token for private user data
 */
export default async function getUser(req: Request, res: Response) {
    try {
        const {identifier} = req.params;
        if (!identifier) {
            return res.status(400).json({
                status: "error",
                message: "Missing user identifier (Hint: must be passed as route parameter)"
            });
        }

        const db = await getDB();
        const usersColl = db.collection<DBUser>("users");
        const postsColl = db.collection<DBPost>("posts");

        let user: DBUser | null = null;

        // try each check until one or none succeeds
        const checkFuncs = [
            () => findUserById(usersColl, identifier),
            () => findUserByPostId(usersColl, postsColl, identifier),
            () => findUserByUsername(usersColl, identifier),
        ];
        for (const check of checkFuncs) {
            user = await check();
            if (user) break;
        }

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "User retrieved",
            data: {
                user: {
                    id: user._id,
                    ctime: user.ctime,
                    username: user.username,
                    posts: user.posts,
                    profileImg: user.profileImg,
                    followers: user.followers,
                    following: user.following,
                    reactions: user.reactions
                }
            }
        });
        
    } catch (e: any) {
        console.error(e);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}
