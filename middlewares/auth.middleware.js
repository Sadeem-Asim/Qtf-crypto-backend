import jwt from "jsonwebtoken";

import {JWT_ERRORS} from "#constants/index";
import {getEnv} from "#utils/common/env";

const authMiddleware = (req, res, next) => {
    if (!getEnv('REQUIRES_AUTH'))
        return next();

    const token = req.header('x-auth-token') || req.cookies['x-auth-token'];
    if (!token)
        return res.status(401).send("Access denied. No token provided.");

    try {
        req.user = jwt.verify(token, getEnv('JWT_SECRET'));
        next();
    } catch (ex) {
        if (ex.message === JWT_ERRORS.expired)
            return res.status(400).send("Jwt Token is Expired");

        res.status(400).send("Invalid token.");
    }
};

export default authMiddleware
