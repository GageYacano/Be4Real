
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

        // Find user
        const usersColl = db.collection<DBUser>("users");
        const user = await usersColl.findOne({ email });
        if (user === null) 
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        
        // Check code
        if (user.verifCode !== code) 
            return res.status(401).json({
                status: "error",
                message: "Invalid code",
                invalidCode: true
            })

        // Set user to verified
        await usersColl.updateOne({ 
            _id: user._id
        }, {
            "$set": {
                verified: true,
                verifCode: null
            }
        })

        // issue auth jwt
        const authToken = await createJWT(user._id.toHexString());
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
