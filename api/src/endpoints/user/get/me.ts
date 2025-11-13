import { Request, Response } from "express";
import { getDB } from "../../../utils/mongo.js";
import { DBUser } from "../../../types/mongo_schemas.js";
import { getJWT, checkJWT } from "../../../utils/jwt.js";
import { ObjectId } from "mongodb";

export default async function getCurrentUser(req: Request, res: Response) {
    try {
        const { err: headerErr, token } = getJWT(req.headers.authorization);
        if (headerErr) {
            return res.status(401).json({
                status: "error",
                message: headerErr.message || "Missing or invalid authorization header"
            });
        }

        const { err: jwtErr, uid } = await checkJWT(token);
        if (jwtErr) {
            return res.status(401).json({
                status: "error",
                message: "Invalid token"
            });
        }

        const db = await getDB();
        const usersColl = db.collection<DBUser>("users");
        if (!ObjectId.isValid(uid)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid user id in token"
            });
        }
        console.log(uid)
        const user = await usersColl.findOne({ _id: new ObjectId(uid) });

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: "success",
            user: {
                id: user._id?.toHexString(),
                username: user.username,
                followers: user.followers,
                following: user.following,
                reactions: user.reactions
            }
        });
    } catch (e: any) {
        console.error(e);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
}
