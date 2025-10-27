
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Import endpoint logic
import register from "./endpoints/auth/register.js";
import login from "./endpoints/auth/login.js";
import verifyUser from "./endpoints/auth/verfiy_user.js";
import resendVerification from "./endpoints/auth/resend_verification.js";
import makePost from "./endpoints/post/make_post.js";

dotenv.config();
const WEB_DIR = path.resolve("../web");
const PORT = 8080

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
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.post("/api/auth/verify-user", verifyUser);
app.post("/api/auth/resend-verification", resendVerification);
app.post("/api/post/make-post", makePost);

// Static site content
app.use(express.static(WEB_DIR, { 
    index: "index.html", 
    extensions: ["html"] 
}));

app.use((_, res) => res.status(404).json({ 
    status: "error", 
    message: "Not found" 
}));

app.listen(PORT, () => console.log("Server running on port " + PORT));
