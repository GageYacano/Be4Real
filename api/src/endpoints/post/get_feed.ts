import { Request, Response } from "express";
import { getDB } from "../../utils/mongo.js";
import { DBPost } from "../../types/mongo_schemas.js";
import { ObjectId } from "mongodb";

export default async function getFeed(req: Request, res: Response) {
  try {
    const { before, after, limit } = req.query;

    // validate limit
    let validLimit = 20;
    if (limit) {
      const n = parseInt(limit as string, 10);
      if (!Number.isFinite(n) || n < 1) {
        return res.status(400).json({ status: "error", message: "Invalid limit" });
      }
      validLimit = Math.min(n, 50);
    }

    if (before && after) {
      return res.status(400).json({
        status: "error",
        message: "Cannot use both 'before' and 'after' params",
      });
    }

    const db = await getDB();
    const postsColl = db.collection<DBPost>("posts");

    const filter: any = {};
    if (before) {
      if (!ObjectId.isValid(before as string)) {
        return res.status(400).json({ status: "error", message: "Invalid 'before' post ID" });
      }
      filter._id = { $lt: new ObjectId(before as string) }; // older than pivot
    } else if (after) {
      if (!ObjectId.isValid(after as string)) {
        return res.status(400).json({ status: "error", message: "Invalid 'after' post ID" });
      }
      filter._id = { $gt: new ObjectId(after as string) }; // newer than pivot
    }

    // Always return newest first
    // server: getFeed()
    const docs = await postsColl
    .find(filter)
    .sort({ _id: -1 })
    .limit(validLimit)
    .toArray();

    const posts = docs.map(p => ({
    ...p,
    _id: p._id.toString(),   // ensure JSON string, not an object
    postId: p._id.toString(), // convenient alias for clients
    }));

    res.status(200).json({
    status: "success",
    message: "Feed retrieved",
    data: { count: posts.length, posts },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
}
