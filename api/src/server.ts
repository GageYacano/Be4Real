
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import {setupIndexes} from "./utils/setup_indexes.js";

dotenv.config();

// Import endpoint logic
import register from "./endpoints/auth/register.js";
import login from "./endpoints/auth/login.js";
import verifyUser from "./endpoints/auth/verfiy_user.js";
import sendVerificationCode from "./endpoints/auth/send_verification.js";
import makePost from "./endpoints/post/make_post.js";
import getSinglePost from "./endpoints/post/get/get_single_post.js";
import react from "./endpoints/post/react/react.js";
import getFeed from "./endpoints/post/get_feed.js";
import getUser from "./endpoints/user/get/get_user.js";
import resetPassword from "./endpoints/auth/reset_password.js";

const WEB_DIR = path.resolve("../web");
const PORT = 3000

const app = express();

// Middleware
app.use(cors({
    origin: ["*"], 
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    credentials: true, // allow cookies / auth headers
}));              
app.use(express.json());  

// API
app.post("/auth/register", register);
app.post("/auth/login", login);
app.post("/auth/send-verification", sendVerificationCode);
app.post("/auth/verify-user", verifyUser);
app.post("/auth/reset-password", resetPassword);
app.post("/post/make-post", makePost);
app.get("/post/get/:postId", getSinglePost);
app.post("/post/react/:postId", react);
app.get("/post/get-feed", getFeed);
app.get("/user/get/:identifier", getUser);


app.use((_, res) => res.status(404).json({ 
    status: "error", 
    message: "Not found" 
}));

// setup database indexes
setupIndexes().catch(console.error);

app.listen(PORT, () => console.log("Server running on port " + PORT));
