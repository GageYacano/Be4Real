
import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcrypt"
import { getDB } from "../../utils/mongo.js";
import { DBUser } from "../../types/mongo_schemas.js";
import { createJWT } from "../../utils/jwt.js";

interface RequestData {
    email: string,
    password: string
}

export default async function login(req: Request, res: Response) {

    try {
        let {
            email,
            password
        }: RequestData = req.body;

        if (!email || !password)
            return res.status(400).json({ 
                status: "error",
                message: "Missing fields" 
            });

        email = email.toLowerCase().trim();
        password = password.trim();

        try {
            z.string().min(8).max(256).parse(password)
            z.email().parse(email)
        } catch (e: any) {
            console.error(e)
            return res.status(400).json({ 
                status: "error",
                message: "Invalid fields",
            })
        }

        // get user by email
        const db = await getDB();
        const usersColl = db.collection<DBUser>("users");
        const user = await usersColl.findOne({ email });
    
        if (user === null) 
            return res.status(400).json({
                status: "error",
                message: "Invalid username or password"
            });
        
        if (user.loginMethod !== "password")
            return res.status(403).json({
                status: "error",
                message: "Incorrect login method for user"
            });
        
        const validPassword = await bcrypt.compare(password, user.passHash ?? "");
        if (!validPassword)
            return res.status(400).json({
                status: "error",
                message: "Invalid username or password"
            });

        if (!user.verified) 
            return res.status(403).json({
                status: "error",
                message: "User requires verification",
                needsVerification: true
            });

        // issue auth jwt
        const authToken = await createJWT(user._id.toHexString());
        return res.status(200).json({
            status: "success",
            message: "Log in successful",
            token: authToken
        })
    
    } catch (e: any) {
        console.error(e)
        res.status(500).json({ 
            status: "error",
            message: "Internal server error"
        })
    }

}