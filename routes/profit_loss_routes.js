import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import {
  getProfitLossAccountDetails,
  getProfitLossAccountDetailsByUser,
  paidHistory,
  userDashboard,
} from "#controllers/profit_loss.controller";

const profitLossRoutes = express.Router();

profitLossRoutes.get("/paid_history", authMiddleware, paidHistory);
profitLossRoutes.get("/user_dashboard", authMiddleware, userDashboard);
profitLossRoutes.get("/account", authMiddleware, getProfitLossAccountDetails);
profitLossRoutes.get(
  "/account/:id",
  authMiddleware,
  getProfitLossAccountDetailsByUser
);

export default profitLossRoutes;
