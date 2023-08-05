import express from "express";
import {
  createBot,
  getAllBots,
  updateBot,
  deleteBot,
  getUserBots,
  openOrdersUserBots,
  closeOrdersUserBots,
  updateBotAndSetting,
  getBotStats,
} from "#controllers/bot.controller";
import authMiddleware from "#middlewares/auth.middleware";
import validateMongooseIdMiddleware from "#middlewares/validateMongooseId.middleware";

const botRoutes = express.Router();

botRoutes
  .route("/")
  .post(authMiddleware, createBot)
  .get(authMiddleware, getAllBots);

botRoutes.put("/settings/:id", [authMiddleware], updateBotAndSetting);

botRoutes.get("/user-orders/:id", [authMiddleware], getUserBots);
botRoutes.get("/open-orders", [authMiddleware], openOrdersUserBots);
botRoutes.get("/close-orders", [authMiddleware], closeOrdersUserBots);
botRoutes.put("/settings/:id", [authMiddleware], updateBotAndSetting);

botRoutes.get(
  "/settings/stats/:id",
  [validateMongooseIdMiddleware, authMiddleware],
  getBotStats
);

botRoutes
  .route("/:id")
  .put([validateMongooseIdMiddleware, authMiddleware], updateBot)
  .delete([authMiddleware], deleteBot);

export default botRoutes;
