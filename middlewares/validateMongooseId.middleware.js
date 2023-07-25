import mongoose from "mongoose";

const validateMongooseIdMiddleware = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(404).send('Invalid Param id.');

    next();
}

export default validateMongooseIdMiddleware
