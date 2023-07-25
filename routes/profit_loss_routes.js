import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import {getProfitLossAccountDetails, paidHistory, userDashboard} from "#controllers/profit_loss.controller";

const profitLossRoutes = express.Router();


profitLossRoutes.get('/paid_history', authMiddleware, paidHistory);
profitLossRoutes.get('/user_dashboard', authMiddleware, userDashboard);
profitLossRoutes.get('/account', authMiddleware, getProfitLossAccountDetails)

export default profitLossRoutes;