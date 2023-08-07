import express from "express";
import { loginUser, logout } from "#controllers/auth.controller";

const authRoutes = express.Router();

authRoutes.post("/", loginUser);
authRoutes.get("/logout", logout);

export default authRoutes;
