import express from "express";
import {
  closeOrder,
  createOrderTest,
  exchangeInfo,
  getAccountInformation,
  getAllOrders,
  getUSDTBalance,
  newOrder,
  priceChangeIn24hrStatistics,
  priceTickler,
  testApi,
  getAvailableBalance,
  universalTransfer,
  futurePrices,
  futureMarketBuySell,
  getPositionRisk,
  marketClose,
  adjustMargin,
  getLeverageStats,
  universalConversion,
  getActiveOrder,
  updateTakeProfit,
  updateProfit,
  futureLimitBuySell,
  deleteOrder,
  deleteHistory,
} from "#controllers/binance.controller";
import authMiddleware from "#middlewares/auth.middleware";

const binanceRoutes = express.Router();

binanceRoutes.get("/account", authMiddleware, getAccountInformation);
binanceRoutes.post("/new_order", authMiddleware, newOrder);
binanceRoutes.post("/close_order", authMiddleware, closeOrder);
binanceRoutes.get("/create_order_test", authMiddleware, createOrderTest);
binanceRoutes.get("/exchange_info", authMiddleware, exchangeInfo);
binanceRoutes.get("/priceTickler", authMiddleware, priceTickler);
binanceRoutes.get(
  "/24hrPriceTickler",
  authMiddleware,
  priceChangeIn24hrStatistics
);
binanceRoutes.get(
  "/activeOrder/:id/:coin/:type",
  authMiddleware,
  getActiveOrder
);
binanceRoutes.delete("/activeOrder/:id", authMiddleware, deleteOrder);

binanceRoutes.get("/all_orders", authMiddleware, getAllOrders);
binanceRoutes.get("/balance", authMiddleware, getUSDTBalance);
binanceRoutes.get("/testApi", testApi);
binanceRoutes.get(
  "/availableBalance/:id/:coin/:account",
  authMiddleware,
  getAvailableBalance
);
binanceRoutes.post("/transfer", authMiddleware, universalTransfer);
binanceRoutes.get("/futurePrices/:id", authMiddleware, futurePrices);
binanceRoutes.post("/futureMarket", authMiddleware, futureMarketBuySell);
binanceRoutes.post("/futureLimit", authMiddleware, futureLimitBuySell);

binanceRoutes.get("/positionRisk/:id/:coin", authMiddleware, getPositionRisk);
binanceRoutes.post("/marketClose", authMiddleware, marketClose);
binanceRoutes.post("/adjustMargin", authMiddleware, adjustMargin);
binanceRoutes.get(
  "/leverageHistory/:id/:coin",
  authMiddleware,
  getLeverageStats
);
binanceRoutes.put("/takeProfit", authMiddleware, updateTakeProfit);
binanceRoutes.put("/profit", authMiddleware, updateProfit);
binanceRoutes.put("/history", authMiddleware, deleteHistory);
binanceRoutes.post("/convert", authMiddleware, universalConversion);
export default binanceRoutes;
