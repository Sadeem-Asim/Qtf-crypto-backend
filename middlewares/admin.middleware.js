import {getEnv} from "#utils/common/env";

const admin = (req, res, next) => {
    // 401 Unauthorized
    // 403 Forbidden
    if (!getEnv('REQUIRES_AUTH'))
        return next();

    if (req.user.role !== "ADMIN")
        return res.status(403).send("Access denied.");

    next();
};


export default admin