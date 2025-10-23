
import { MongoClient, Db, ServerApiVersion} from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = "mongodb+srv://root:" + process.env.MONGO_PWD + "@be4realdb.o2hgd3j.mongodb.net/?retryWrites=true&w=majority&appName=Be4RealDB";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db: Db;

async function getDB() {
    if (!db) {
        await client.connect();
        db = client.db("Be4RealDB");
    }
    return db;
}

export {
    getDB
}
