// npm i jose
import { jwtVerify, SignJWT } from "jose";

const ISSUER = "myapp";
const AUDIENCE = "myapp-web";
const ONE_WEEK = 7 * 24 * 60 * 60;
const SIX_WEEKS = ONE_WEEK * 6;
const NEW_TTL = "30d"; // what you want refreshed tokens to live for

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

type CheckJwtResult = { jwt: string | null; err: string | null };

async function checkJwt(token: string): Promise<> {

        try {
            // Verify signature + iss/aud/exp etc.
            const { payload } = await jwtVerify(token, secret, {
                issuer: ISSUER,
                audience: AUDIENCE,
                clockTolerance: "5s",
            });
        } catch (e: any) {
            return false
        }

}

export async function checkAndRefreshJwt(token: string): Promise<CheckJwtResult> {
    try {
        // Verify signature + iss/aud/exp etc.
        const { payload } = await jwtVerify(token, secret, {
            issuer: ISSUER,
            audience: AUDIENCE,
            clockTolerance: "5s",
        });

        // If no exp, treat as invalid policy
        if (typeof payload.exp !== "number") {
        return { jwt: null, err: "token missing exp" };
        }

        const now = Math.floor(Date.now() / 1000);
        const secondsLeft = payload.exp - now;

        // Refresh if expiring within a week
        if (secondsLeft <= ONE_WEEK) {
            // Re-sign with same claims (minus standard time claims)
            const {
                exp: _exp,
                iat: _iat,
                nbf: _nbf,
                iss: _iss,
                aud: _aud,
                ...rest
            } = payload as Record<string, any>;

            const refreshed = await new SignJWT(rest)
                .setProtectedHeader({ alg: "HS256", typ: "JWT" })
                .setIssuer(ISSUER)
                .setAudience(AUDIENCE)
                .setIssuedAt()
                .setExpirationTime(NEW_TTL)
                .sign(secret);

            return { jwt: refreshed, err: null };
        }

        // Still good; return original
        return { jwt: token, err: null };
    } catch (e: any) {
        // jose throws JWTExpired for expired tokens; everything else is invalid
        const msg = e?.code === "ERR_JWT_EXPIRED" || e?.name === "JWTExpired"
        ? "token expired"
        : "invalid token";
        return { jwt: null, err: msg };
    }
}
