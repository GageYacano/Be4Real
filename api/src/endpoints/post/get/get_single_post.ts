import {Request, Response} from "express";
import {getDB} from "../../../utils/mongo.js";
import {DBPost} from "../../../types/mongo_schemas.js";
//import {getJWT, checkJWT} from "../../utils/jwt.js";
import {ObjectId} from "mongodb";

/**
 * Gets a single post by ID
 *
 * @param req.params - post id passed in through route param
 *
 * (ex. http://<IP>:<PORT>/api/post/<UNIQUE_MONGO_ObjectId_FOR_POST>)
 */
export default async function getSinglePost(req: Request, res: Response) {
    try {
        // don't need jwt auth if posts are visible to anyone
        // const {err: getJWTErr, token} = getJWT(req.headers.authorization);
        // if (getJWTErr !== null) {
        //     return res.status(401).json({
        //         status: "error",
        //         message: getJWTErr.message
        //     });
        // }
        //
        // const {err: checkJWTErr, uid} = await checkJWT(token);
        // if (checkJWTErr !== null) {
        //     return res.status(401).json({
        //         status: "error",
        //         message: checkJWTErr.message
        //     });
        // }

        const {postId} = req.params;
        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "Missing post ID (Hint: must be passed as route parameter)"
            });
        }

        // validate post ID
        if (!ObjectId.isValid(postId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid post ID"
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

        res.status(200).json({
            status: "success",
            message: "Post retrieved",
            data: {
                post: post
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
