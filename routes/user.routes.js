import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import {
    getUser,
    registerUser,
    updateUser,
    getAllUser,
    getAllUnAssignedUser,
    saveApiKeys, getApiKeys
} from "#controllers/user.controller";
import validateMongooseIdMiddleware from "#middlewares/validateMongooseId.middleware";

const userRoutes = express.Router();

userRoutes.route('/').post(registerUser);
userRoutes.get('/all', authMiddleware,getAllUser);
userRoutes.post('/api_keys', authMiddleware, saveApiKeys)
userRoutes.get('/api_keys', authMiddleware, getApiKeys)
userRoutes.get('/me', authMiddleware, getUser);
userRoutes.get('/unasigned_user', getAllUnAssignedUser);
userRoutes.put('/:id', [validateMongooseIdMiddleware, authMiddleware], updateUser)

export default userRoutes;
