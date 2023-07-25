import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

import botRoutes from "#routes/bot.routes";
import userRoutes from "#routes/user.routes";
import authRoutes from "#routes/auth.routes";
import adminRoutes from "#routes/admin/index";
import taapiRoutes from "#routes/taapi.routes";
import binanceRoutes from "#routes/binance.routes";
import predictionRoutes from "#routes/prediction.routes";
import profitLossRoutes from "#routes/profit_loss_routes";
import purchaseStats from "#routes/purchase_stats.routes";
import ApiLogMiddleware from "#middlewares/apiLog.middleware";
import errorMiddleware, { _404_NotFound } from "#middlewares/error.middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routes = (app) => {
  app.use(ApiLogMiddleware);

  app.use("/api/bots", botRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/taapi", taapiRoutes);
  app.use("/api/binance", binanceRoutes);
  app.use("/api/prediction", predictionRoutes);
  app.use("/api/profit_loss", profitLossRoutes);
  app.use("/api/purchase_stats", purchaseStats);
  adminRoutes(app);

  app.use("/data", express.static(path.resolve(__dirname, "../", "data")));

  // if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, "../build")));
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "../", "build", "index.html"))
  );
  // }

  app.use(_404_NotFound);
  app.use(errorMiddleware);
};

export default routes;
