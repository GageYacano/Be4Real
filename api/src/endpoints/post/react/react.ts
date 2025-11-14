import {Request, Response} from "express";
import {z} from "zod";
import {getDB} from "../../../utils/mongo.js";
import {DBPost, DBReaction, DBUser} from "../../../types/mongo_schemas.js";
import {getJWT, checkJWT} from "../../../utils/jwt.js";
import {ObjectId} from "mongodb";

interface RequestData {
    reaction: string;
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

        // get postId
        const {postId} = req.params;
        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "Missing post ID (Hint: must be passed as route parameter)"
            });
        }

        // validate postId
        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid post ID"
            });
        }

        // get reaction
        let {reaction}: RequestData = req.body;
        if (!reaction) {
            return res.status(400).json({
                status: "error",
                message: "Missing reaction"
            });
        }

        // validate reaction
        try {
            z.string().min(1).max(50).parse(reaction);
        } catch (e: any) {
            console.error(e);
            return res.status(400).json({
                status: "error",
                message: "Invalid reaction"
            });
        }

        const db = await getDB();
        const postsColl = db.collection<DBPost>("posts");
        const usersColl = db.collection<DBUser>("users");

        const postObjectId = new ObjectId(postId);
        const userObjectId = new ObjectId(uid);

        // find the post
        const post = await postsColl.findOne({_id: postObjectId});
        if (!post) {
            return res.status(404).json({
                status: "error",
                message: "Post not found"
            });
        }

        // check if user already has a reaction on this post
        const existingReaction = await reactionsColl.findOne({
            post: postObjectId,
            user: userObjectId
        });

        if (existingReaction) {
            if (existingReaction.reaction === reaction) { // if same reaction
                // delete reaction in reaction document
                await reactionsColl.deleteOne({_id: existingReaction._id});

                // decrement count in post document
                await postsColl.updateOne(
                    {_id: postObjectId},
                    {$inc: {[`reactions.${reaction}`]: -1}}
                );

                // decrement user reaction count
                await usersColl.updateOne(
                    {_id: userObjectId},
                    {$inc: {reactions: -1}}
                );

                return res.status(200).json({
                    status: "success",
                    message: "Reaction removed",
                });
            } else { // if new reaction

                const oldReaction = existingReaction.reaction;

                // override old reaction to reflect new one
                await reactionsColl.updateOne(
                    {_id: existingReaction._id},
                    {
                        $set: {
                            reaction: reaction,
                            ctime: Date.now()
                        }
                    }
                );

                // update counts in post document
                await postsColl.updateOne(
                    {_id: postObjectId},
                    {
                        $inc: {
                            [`reactions.${oldReaction}`]: -1, // TODO: should old reactions be kept or discarded?
                            [`reactions.${reaction}`]: 1
                        }
                    }
                );

                return res.status(200).json({
                    status: "success",
                    message: "Reaction updated",
                });
            }
        } else { // no existing reaction
            // create new reaction
            const newReaction: DBReaction = {
                post: postObjectId,
                user: userObjectId,
                reaction: reaction,
                ctime: Date.now()
            };

            await reactionsColl.insertOne(newReaction);

            // increment count in post document
            await postsColl.updateOne(
                {_id: postObjectId},
                {$inc: {[`reactions.${reaction}`]: 1}}
            );

            // increment user reaction count
            await usersColl.updateOne(
                {_id: userObjectId},
                {$inc: {reactions: 1}}
            );

            return res.status(200).json({
                status: "success",
                message: "Reaction added",
            });
        }

    } catch (e: any) {
        console.error(e);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }

}
