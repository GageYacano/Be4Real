import {Request, Response} from "express";
import {getDB} from "../../utils/mongo.js";
import {DBPost} from "../../types/mongo_schemas.js";
import {ObjectId} from "mongodb";

/**
 * Get posts for the feed.
 *
 * @param req.query.before - Get posts older than this post ID (for loading more)
 * @param req.query.after - Get posts newer than this post ID (for refresh)
 * @param req.query.limit - Number of posts to return (default 20 & max 50)
 *
 * Examples:
 * - Initial load: GET /api/posts/feed?limit=20
 * - Load more: GET /api/posts/feed?before=<POST_ID>&limit=20
 * - Refresh: GET /api/posts/feed?after=<POST_ID>&limit=20
 */
export default async function getFeed(req: Request, res: Response) {
    try {
        const {
            before,
            after,
            limit
        } = req.query;

        // validate limit
        let validLimit = 20; // default value
        if (limit) {
            validLimit = parseInt(limit as string);
            if (isNaN(validLimit) || validLimit < 1) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid limit"
                });
            }
            if (validLimit > 50) { // max value
                validLimit = 50;
            }
        }

        // validate before and after params (can't use both in same query)
        if (before && after) {
            return res.status(400).json({
                status: "error",
                message: "Cannot use both 'before' and 'after' params"
            });
        }

        const db = await getDB();
        const postsColl = db.collection<DBPost>("posts");

        let posts: DBPost[];

        if (before) {
            // get posts older than the pivot post
            if (!ObjectId.isValid(before as string)) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid 'before' post ID"
                });
            }

            // get and check pivot post
            const pivotPost = await postsColl.findOne({_id: new ObjectId(before as string)});
            if (!pivotPost) {
                return res.status(404).json({
                    status: "error",
                    message: "Pivot post not found"
                });
            }

            // get posts with ctime less than pivot's ctime
            posts = await postsColl
                .find({ctime: {$lt: pivotPost.ctime}})
                .sort({ctime: -1}) // descending
                .limit(validLimit)
                .toArray();

        } else if (after) {
            // get posts newer than pivot
            if (!ObjectId.isValid(after as string)) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid 'after' post ID"
                });
            }

            // get and check pivot
            const pivotPost = await postsColl.findOne({_id: new ObjectId(after as string)});
            if (!pivotPost) {
                return res.status(404).json({
                    status: "error",
                    message: "Pivot post not found"
                });
            }

            // get posts with ctime greater than pivot's ctime
            posts = await postsColl
                .find({ctime: {$gt: pivotPost.ctime}})
                .sort({ctime: -1}) // descending order
                .limit(validLimit)
                .toArray();

        } else { // no pivot case

            // get absolute most recent posts
            posts = await postsColl
                .find({})
                .sort({ctime: -1}) // descending order
                .limit(validLimit)
                .toArray();
        }

        res.status(200).json({
            status: "success",
            message: "Feed retrieved",
            data: {
                count: posts.length,
                posts: posts
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
