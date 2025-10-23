
import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt"
import { getDB } from "../../utils/mongo.js";
import { DBUser } from "../../types/mongo_schemas.js";
import { randomInt } from "crypto";

interface RequestData {
    username: string,
    email: string,
    password: string
}

export default async function register(req: Request, res: Response) {

    try {

        let {
            username,
            email,
            password
        }: RequestData = req.body;

        username = username.trim()
        email = email.toLowerCase().trim()
        password = password.trim()

        // Check for missing fields
        if (!username || !email || !password)
            return res.status(400).json({ 
                status: "error",
                message: "Missing fields" 
            })
        
        // Validate fields
        try {
            z.string().min(3).max(32).parse(username)
            z.string().min(8).max(256).parse(password)
            z.email().parse(email)
        } catch (e: any) {
            console.error(e)
            return res.status(400).json({ 
                status: "error",
                message: "Invalid fields"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const verifCode = String(randomInt(0, 1_000_000)).padStart(6, "0");
        console.log("Verification code for " + email + ": " + verifCode); // for dev

        const db = await getDB()
        const usersColl = db.collection<DBUser>("users")

        // Insert new user
        // TODO: make unique index on email
        const user: DBUser = {
            ctime: Date.now(),
            loginMethod: "password",
            username: username,
            email: email,
            passHash: passwordHash,
            verified: false,
            verifCode: verifCode,
            posts: [],
            followers: 0,
            following: 0,
            reactions: 0
        }        
        try {
            await usersColl.insertOne(user);
        } catch (err: any) {
            if (err.code === 11000) {
                return res.status(409).json({ 
                    status: "error",
                    message: "Email already exists"
                });
            }
            throw err;
        }

        // TODO: send email/sms

        res.status(200).json({ 
            status: "success",
            message: "User created"
        })

    } catch (e: any) {
        console.error(e)
        return res.status(500).json({ error: "Internal server error" })
    }

}