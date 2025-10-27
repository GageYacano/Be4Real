// TODO: should reactions be coupled to users? if so, how should this be implemented?

import {Request, Response} from "express";
import {z} from "zod";
import {getDB} from "../../utils/mongo.js";
import {DBPost} from "../../types/mongo_schemas.js";
import {getJWT, checkJWT} from "../../utils/jwt.js";
import {ObjectId} from "mongodb";

interface RequestData {
    reaction: string;
}

/**
 * Adds a reaction to a post.
 *
 * @param req.params - post id passed in through route param
 * @param req.body.reaction - string containing reaction
 */
export default async function react(req: Request, res: Response) {
    try {
        const {err: getJWTErr, token} = getJWT(req.headers.authorization);
        if (getJWTErr !== null) {
            return res.status(401).json({
                status: "error",
                message: getJWTErr.message
            });
        }

        const {err: checkJWTErr, uid} = await checkJWT(token);
        if (checkJWTErr !== null) {
            return res.status(401).json({
                status: "error",
                message: checkJWTErr.message
            });
        }

        const {postId} = req.params;
        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "Missing post ID"
            });
        }

        // validate post ID
        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid post ID"
            });
        }

        let {reaction}: RequestData = req.body;
        if (!reaction) {
            return res.status(400).json({
                status: "error",
                message: "Missing reaction"
            });
        }

        // validate request body
        try {
            z.string().min(1).max(50).parse(reaction); // TODO: what should a valid reaction be?
        } catch (e: any) {
            console.error(e);
            return res.status(400).json({
                status: "error",
                message: "Invalid reaction"
            });
        }

        const db = await getDB();
        const postsColl = db.collection<DBPost>("posts");

        // find the post
        const post = await postsColl.findOne({_id: new ObjectId(postId)});
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "Post not found"
            });
        }

        const reactionIndex = post.reactions.findIndex(r => r[reaction] !== undefined);
        if (reactionIndex !== -1) { // reaction exists
            // increment count
            await postsColl.updateOne(
                {_id: new ObjectId(postId)},
                {$inc: {[`reactions.${reactionIndex}.${reaction}`]: 1}}
            );
        } else { // reaction does not exist
            // add new to array
            await postsColl.updateOne(
                {_id: new ObjectId(postId)},
                {$push: {reactions: {[reaction]: 1}}}
            );
        }

        // TODO: Increment the user's 'reactions' counter

        res.status(200).json({
            status: "success",
            message: "Reaction added",
        });

    } catch (e: any) {
        console.error(e);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }

}
