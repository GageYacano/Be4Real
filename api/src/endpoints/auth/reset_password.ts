
import { Request, Response } from "express";
import { z } from "zod";
import { getDB } from "../../utils/mongo.js";
import { DBUser } from "../../types/mongo_schemas.js";
import bcrypt from "bcrypt"

interface RequestData {
    email: string,
    newPassword: string,
    code: string
}

export default async function resetPassword(req: Request, res: Response) {

    try {
        let {
            email,
            newPassword,
            code
        }: RequestData = req.body;

        if (!email || !code || !newPassword)
            return res.status(400).json({ 
                status: "error",
                message: "Missing fields" 
            })

        email = email.toLowerCase().trim()
        code = code.trim()
        newPassword = newPassword.trim()

        try {
            z.email().parse(email)
            z.string().min(8).max(256).parse(newPassword)
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
                passHash: await bcrypt.hash(newPassword, 10), 
                verifCode: null 
            } 
        }, { 
            returnDocument: "after" 
        });
        if (!updatedUser) 
            return res.status(400).json({
                status: "error",
                message: "User not found or incorrect verification code"
            });
        
        return res.status(200).json({
            status: "success",
            message: "Password reset"
        })
        
    } catch (e: any) {
        console.error(e)
        res.status(500).json({ 
            status: "error",
            message: "Internal server error"
        })
    }

}