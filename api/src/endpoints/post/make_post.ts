import {Request, Response} from "express";
import {z} from "zod";
import {getDB} from "../../utils/mongo.js";
import {DBPost, DBUser} from "../../types/mongo_schemas.js";
import {getJWT, checkJWT} from "../../utils/jwt.js";
import {ObjectId} from "mongodb";

interface RequestData {
    /** base64 encoded image string */
    imgData: string;
}

/**
 * Makes a post for a user.
 *
 * Sample request:
 * curl -X POST http://<IP>:<PORT>/api/post/make-post \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <YOUR_TOKEN>" \
    -d '{"imgData": "data:image/png;base64,<BASE64_ENCODED_STRING>"}'
 * @param req.body.imgData - base64 encoded image string
 */
export default async function makePost(req: Request, res: Response) {

    try {
        const {err: getJWTErr, token} = getJWT(req.headers.authorization);
        if (getJWTErr !== null) {
            return res.status(401).json({ // 401 unauthorized
                status: "error",
                message: getJWTErr.message
            });
        }

        const {err: checkJWTErr, uid} = await checkJWT(token);
        if (checkJWTErr !== null) {
            return res.status(401).json({ // 401 unauthorized
                status: "error",
                message: checkJWTErr.message
            });
        }

        let {
            imgData
        }: RequestData = req.body;
        if (!imgData) {
            return res.status(400).json({ // 400 bad request
                status: "error",
                message: "Missing fields"
            });
        }

        // validate request body
        try {
            // make sure it's not an empty string
            z.string().min(1).parse(imgData);
        } catch (e: any) {
            console.error(e);
            return res.status(400).json({ // 400 bad request
                status: "error",
                message: "Invalid fields"
            });
        }

        const db = await getDB();
        const postsColl = db.collection<DBPost>("posts");
        const usersColl = db.collection<DBUser>("users");

        // make sure user exists
        const userId = new ObjectId(uid);
        const user = await usersColl.findOne({_id: userId});
        if (!user) {
            return res.status(404).json({ // 404 not found
                status: "error",
                message: "User not found"
            });
        }

        // now, create new post
        const post: DBPost = {
            ctime: Date.now(),
            imgData: imgData,
            user: userId,
            reactions: []
        };

        // insert post into db
        const insertResult = await postsColl.insertOne(post);
        const postId = insertResult.insertedId;

        // update user posts array
        await usersColl.updateOne(
            {_id: userId},
            {$push: {posts: postId}}
        );

        res.status(200).json({ // 200 OK
            status: "success",
            message: "Post created",
        });

    } catch (e: any) {
        console.error(e);
        res.status(500).json({ // 500 internal server error
            status: "error",
            message: "Internal server error"
        });
    }

}
