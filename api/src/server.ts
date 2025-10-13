import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = "mongodb+srv://root:" + process.env.MONGO_PWD + "@be4realdb.o2hgd3j.mongodb.net/?retryWrites=true&w=majority&appName=Be4RealDB";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
console.log("hello")
try {
    await client.connect();
    await client.db("Be4RealDB").command({ ping: 1 });

    const app = express();
    app.get("/", (_req, res) => res.send("Hello Worldd!"));

    app.listen(3000, () => console.log("Server running on port 3000"));

} catch (e) {
    console.error("Server crashed" + e);
} finally {
    await client.close();
}
