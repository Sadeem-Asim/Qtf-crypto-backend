import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { Bot } from "#models/bot.model";
import isWithinDays from "#utils/common/isWIthinDays";
import _ from "lodash";
import assignProfit from "#utils/common/assignProfit";
import { EXCHANGES } from "#constants/index";
import {
  calculateProfitLoss,
  calculateTotalProfit,
  calculateTotalRunningAssets,
  round3Precision,
} from "#utils/common/calculations";
import _totalProfitChartAggregate from "#utils/common/_totalProfitChartAggregate";
import todayProfit from "#utils/aggregates/todayProfit";
import _dailyProfitChartAggregate from "#utils/common/_dailyProfitChartAggregate";
import getWinrate from "#utils/profit_loss/getWinrate";
import getProfitDistribution from "#utils/profit_loss/getProfitDistribution";
import getBills from "#utils/profit_loss/getBills";
import profitLoss from "#utils/aggregates/profitLoss";
import { LeverageHistory } from "#models/leverageHistoryModel";

const getUsersPortfolio = asyncHandlerMiddleware(async (req, res) => {
  const bots = await Bot.find().populate("user", [
    "name",
    "active",
    "isAdminApprove",
  ]);
  res.status(200).send(bots);
});

/**
 @desc     Profit Loss Admin Dashboard
 @route    GET /api/admin/profit_loss/dashboard
 @access   Private
 */
const getProfitLossDashboard = asyncHandlerMiddleware(async (req, res) => {
  const filter = { exchange: EXCHANGES[0] };
  const exchange = req?.query?.exchange;
  const leverages = await LeverageHistory.find({});
  let leverageProfit = leverages.reduce(calculateTotalProfit, 0);

  if (exchange) filter["exchange"] = _.toUpper(exchange);

  const bots = await Bot.find(filter);
  const runningBots = await Bot.countDocuments({ ...filter, isActive: true });
  const _bots = await assignProfit(bots);

  const winrateData = getWinrate(_bots, leverages); //NOTE::Winrate
  // console.log(winrateData);
  //  NOTE::  Profit Distribution && Asset Allocation Calculation
  const { profitDistributionData, assetAllocationData } =
    getProfitDistribution(_bots); // TODO:: May be pass bots

  const totalProfitPrice = _bots.reduce(calculateTotalProfit, 0); //NOTE::Total Profit Price
  const totalRunningAssets = _bots.reduce(calculateTotalRunningAssets, 0); //NOTE::Total Running Assets
  const { billsData } = await getBills(); //NOTE:: Bills Stats

  /*******    NOTE::      TOTAL PROFIT CHART      *********/

  const week = await _totalProfitChartAggregate(7, filter); //NOTE:: Week Chart Data
  const fortnight = await _totalProfitChartAggregate(15, filter); //NOTE:: Fortnight Chart Data
  const month = await _totalProfitChartAggregate(30, filter); //NOTE::One Month Calculation

  const weekTotalPrice = week.reduce(calculateTotalProfit, 0);
  const fortnightTotalPrice = fortnight.reduce(calculateTotalProfit, 0);
  const monthTotalPrice = month.reduce(calculateTotalProfit, 0);

  /*******    NOTE::      Daily PROFIT CHART      *********/

  const _week = await _dailyProfitChartAggregate(7, filter); //  NOTE::Week Calculation
  const _fortnight = await _dailyProfitChartAggregate(15, filter); //  NOTE::Fortnight Calculation
  const _month = await _dailyProfitChartAggregate(30, filter); //   NOTE::One Month Calculation

  const _weekTotalPrice = _week.reduce(calculateTotalProfit, 0);
  const _fortnightTotalPrice = _fortnight.reduce(calculateTotalProfit, 0);
  const _monthTotalPrice = _month.reduce(calculateTotalProfit, 0);
  const todayProfitPrice = await todayProfit(filter);

  const data = {
    runningAssets: totalRunningAssets,
    todayProfitPrice: _.round(todayProfitPrice, 3),
    totalProfitPrice: _.round(totalProfitPrice + leverageProfit, 3),
    totalProfitChart: {
      7: round3Precision(weekTotalPrice),
      15: round3Precision(fortnightTotalPrice),
      30: round3Precision(monthTotalPrice),
    },
    totalProfit: {
      7: week,
      15: fortnight,
      30: month,
    },
    dailyProfitChart: {
      7: round3Precision(_weekTotalPrice),
      15: round3Precision(_fortnightTotalPrice),
      30: round3Precision(_monthTotalPrice),
    },
    dailyProfit: {
      7: _week,
      15: _fortnight,
      30: _month,
    },
    profitDistribution: profitDistributionData,
    winrate: winrateData,
    assetAllocation: assetAllocationData,
    botProfit: billsData,
    totalRunningBots: runningBots,
  };

  res.status(200).send(data);
});

/**
 @desc     Profit Loss Admin Statistics
 @route    GET /api/admin/profit_loss/statistics
 @access   Private
 */
const getProfitLossStatistics = asyncHandlerMiddleware(async (req, res) => {
  const bots = await Bot.find();
  const _bots = await assignProfit(bots);
  const leverages = await LeverageHistory.find({});
  let leverageProfit = leverages.reduce(calculateTotalProfit, 0);
  //  NOTE::  Total Profit Price Calculation
  const totalProfitPrice = _bots.reduce(calculateTotalProfit, 0);

  //  NOTE::  Calculating Total Running Assets
  const totalRunningAssets = _bots.reduce(calculateTotalRunningAssets, 0);

  const todayProfitPrice = await todayProfit();

  const data = {
    running: {
      totalProfitUSDT: _.round(totalProfitPrice + leverageProfit, 3),
      assetsUSDT: totalRunningAssets,
      today: _.round(todayProfitPrice, 3),
    },
    history: {
      total: _.round(totalProfitPrice + leverageProfit, 3),
      today: _.round(todayProfitPrice, 3),
    },
    totalProfit: _.round(totalProfitPrice + leverageProfit, 3),
  };

  res.status(200).send(data);
});

const getProfitLoss = asyncHandlerMiddleware(async (req, res) => {
  const bots = await Bot.find({});

  const month = await profitLoss(30);
  const monthStats = month.reduce(calculateProfitLoss, { profit: 0, loss: 0 });
  const fortnight = await profitLoss(15);
  const fortnightStats = fortnight.reduce(calculateProfitLoss, {
    profit: 0,
    loss: 0,
  });
  const week = await profitLoss(7);
  const weekStats = week.reduce(calculateProfitLoss, { profit: 0, loss: 0 });
  const today = await profitLoss();
  const dailyProfit = today.reduce(calculateProfitLoss, { profit: 0, loss: 0 });

  const data = {
    Daily: dailyProfit,
    Weekly: weekStats,
    ["15 Days"]: fortnightStats,
    ["30 Days"]: monthStats,
  };

  res.status(200).send(data);
});

export {
  getUsersPortfolio,
  getProfitLossDashboard,
  getProfitLossStatistics,
  getProfitLoss,
};
