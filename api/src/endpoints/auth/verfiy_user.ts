
import { Request, Response } from "express";
import { z } from "zod";
import { getDB } from "../../utils/mongo.js";
import { DBUser } from "../../types/mongo_schemas.js";
import { createJWT } from "../../utils/jwt.js";

interface RequestData {
    email: string,
    code: string
}

export default async function verifyUser(req: Request, res: Response) {

    try {
        let {
            email,
            code
        }: RequestData = req.body;

        if (!email || !code)
            return res.status(400).json({ 
                status: "error",
                message: "Missing fields" 
            })

        email = email.toLowerCase().trim()
        code = code.trim()

        try {
            z.email().parse(email)
            z.string().length(6).parse(code)
        } catch (e: any) {
            console.error(e)
            return res.status(400).json({ 
                status: "error",
                message: "Invalid fields"
            })
        }

        const db = await getDB();
        const usersColl = db.collection<DBUser>("users");
        const updatedUser = await usersColl.findOneAndUpdate({ 
            email, 
            verifCode: code 
        }, { 
            $set: { 
                verified: true, 
                verifCode: null 
            } 
        }, { 
            returnDocument: "after" 
        });

        if (!updatedUser)
            return res.status(401).json({
                status: "error",
                message: "Invalid code or user not found",
                invalidCode: true
            });

        // issue auth jwt
        const authToken = await createJWT(updatedUser._id.toHexString());
        return res.status(200).json({
            status: "success",
            message: "User verified",
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
