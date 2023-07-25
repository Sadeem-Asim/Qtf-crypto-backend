import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import adminMiddleware from "#middlewares/admin.middleware";
import {getAllPurchaseStats, getPurchaseStatsByIndicator} from "#controllers/purchase_stats.controller";

const purchaseStats = express.Router();

purchaseStats.get('/', [authMiddleware, adminMiddleware], getAllPurchaseStats);
purchaseStats.get('/:indicator', [authMiddleware, adminMiddleware], getPurchaseStatsByIndicator);

export default purchaseStats;