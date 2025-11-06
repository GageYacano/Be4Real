
import { jwtVerify, SignJWT } from "jose";
import dotenv from "dotenv";
dotenv.config();

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const ISSUER = "Be4Real"
const AUDIENCE = "users"

async function createJWT(uid: string): Promise<string> {
    return await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(uid)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("6w")
    .sign(SECRET);
}

type CheckJwtResult = {
    err: Error | null;
    uid: string;
    exp: number;
}

type CheckRefreshJWTResult = {
    err: Error | null;
    uid: string;
    token: string;
}

type GetJWTResult = {
    err: Error | null;
    token: string;
}

async function checkJWT(token: string): Promise<CheckJwtResult> {
    try {
        const { payload } = await jwtVerify(token, SECRET, {
            issuer: ISSUER,
            audience: AUDIENCE
        });
        
        if (!payload.sub)
            throw new Error("Invalid sub: " + payload.sub)
        if (!payload.exp)
            throw new Error("Invalid expiration: " + payload.exp)

        return {
            err: null,
            uid: payload.sub ?? "",
            exp: (payload.exp ?? 0) * 1000 
        }
    } catch (e: any) {
        return { 
            err: e,
            uid: "",
            exp: 0
        }
    }
}

async function checkAndRefreshJWT(token: string): Promise<CheckRefreshJWTResult> {
    try {
        const { err, uid, exp } = await checkJWT(token);
        if (err !== null)
            throw new Error("Invalid jwt: " + err);

        // if expiring soon, refresh token
        if (exp - Date.now() <= ONE_WEEK)
            token = await createJWT(uid)

        return { 
            err: null, 
            uid: uid,
            token, 
        };
    } catch (e: any) {
        return {
            err: e,
            uid: "",
            token: "",
        }
    }
}

function getJWT(authHeader: string | undefined): GetJWTResult {
    try {
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }
        if (!authHeader.startsWith("Bearer ")) {
            throw new Error("Invalid authorization header format (no \"Bearer \")");
        }

        // extracts token from "Bearer <token>"
        const token = authHeader.substring(7);

        return {
            err: null,
            token: token
        };
    } catch (e: any) {
        return {
            err: e,
            token: ""
        };
    }
}

export {
    CheckJwtResult,
    CheckRefreshJWTResult,
    GetJWTResult,
    createJWT,
    checkJWT,
    checkAndRefreshJWT,
    getJWT
}