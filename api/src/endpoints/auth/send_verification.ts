
import { Request, Response } from "express";
import { z } from "zod";
import { getDB } from "../../utils/mongo.js";
import { DBUser } from "../../types/mongo_schemas.js";
import { randomInt } from "crypto";

interface RequestData {
    email: string,
}

export default async function sendVerificationCode(req: Request, res: Response) {

    try {
        let { email }: RequestData = req.body;
        
        if (!email)
            return res.status(400).json({ 
                status: "error",
                message: "Missing fields" 
            })

        email = email.toLowerCase().trim()
        
        try {
            z.email().parse(email)
        } catch (e: any) {
            console.error(e)
            return res.status(400).json({ 
                status: "error",
                message: "Invalid fields"
            })
        }

        const verifCode = String(randomInt(0, 1_000_000)).padStart(6, "0");

        // Set new code
        const db = await getDB()
        const usersColl = db.collection<DBUser>("users")
        const updateRes = await usersColl.updateOne({ 
            email,
            verified: false
        }, {
            "$set": { verifCode }
        })

        if (updateRes.matchedCount === 0)
            return res.status(400).json({
                status: "error",
                message: "User not found or already verified"
            });

        // TODO: send email/sms
        console.log("Verification code for " + email + ": " + verifCode); // for dev

        return res.status(200).json({
            status: "success",
            message: "New verification code sent"
        })

    } catch (e: any) {
        console.error(e)
        res.status(500).json({ 
            status: "error",
            message: "Internal server error"
        })
    }

}