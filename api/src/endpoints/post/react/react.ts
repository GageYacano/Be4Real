import {Request, Response} from "express";
import {z} from "zod";
import {getDB} from "../../../utils/mongo.js";
import {DBPost, DBReaction, DBUser} from "../../../types/mongo_schemas.js";
import {getJWT, checkJWT} from "../../../utils/jwt.js";
import {ObjectId} from "mongodb";

interface RequestData {
    postId: string;
    reaction: string;
    removeReaction: boolean;
}

/**
 * Adds or updates a reaction to a post.
 * Users can only have one reaction per post.
 * Reacting with the same reaction toggles it off.
 *
 * @param req.params.postId - post id passed in through route param
 * @param req.body.reaction - string containing reaction
 */
export default async function react(req: Request, res: Response) {

    try {

        // check JWT
        const {err: checkJWTErr, uid} = await checkJWT(req.headers.authorization ?? "");
        if (checkJWTErr !== null) {
            return res.status(401).json({
                status: "error",
                message: checkJWTErr.message
            });
        }

        let {
            postId,
            reaction,
            removeReaction,
        }: RequestData = req.body;

        const db = await getDB();
        const postsColl = db.collection<DBPost>("posts");
        const userObjectId = new ObjectId(uid);

        // add reaction to post
        if (!removeReaction)
            await postsColl.updateOne(
                { _id: new ObjectId(postId) },
                { $addToSet: { [`reactions.${reaction}`]: userObjectId } }
            );
        // remove reaction from post
        else    
            await postsColl.updateOne(
                { _id: new ObjectId(postId) },
                { $pull: { [`reactions.${reaction}`]: userObjectId } }
            );

        return res.status(200).json({
            status: "success",
            message: "Reaction updated",
        });
        
    } catch (e: any) {
        console.error(e);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }

}
