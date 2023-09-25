import _ from "lodash";
import { BillingModel } from "#models/billing-modal";
import { LeverageHistory } from "#models/leverageHistoryModel";

export function calculateProfitLoss(total = 0, { profit = 0, loss = 0 }) {
  total["profit"] += _.round(profit, 3);
  total["loss"] += _.round(loss, 3);

  return total;
}

export function calculateTotalProfit(totalProfit = 0, { profit = 0 }) {
  return totalProfit + profit;
}

export function calculateTotalRunningBots(totalRunning = 0, { runningBots }) {
  console.log(runningBots);
  return totalRunning + runningBots;
}

export function calculateTotalRunningAssets(
  totalRunningAssets = 0,
  { runningAsset = 0 }
) {
  return totalRunningAssets + runningAsset;
}

export function calculateProfitDistribution(bots = []) {
  const INITIAL_STATE = { BTC: 0, ETH: 0, investment: 0 };
  if (bots.length <= 0) return INITIAL_STATE;

  return bots.reduce((data, { coin, investment }) => {
    data["investment"] += investment;
    if (coin === "BTC") data["BTC"] += investment;
    if (coin === "ETH") data["ETH"] += investment;
    return data;
  }, INITIAL_STATE);
}

export function calculateWinrate(bots = [], leverages = []) {
  const INITIAL_STATE = { profit: 0, loss: 0, break_even: 0, investment: 0 };

  // if (bots.length <= 0) return INITIAL_STATE;

  const botRes = bots.reduce((obj, { profit, investment }) => {
    if (profit > 0) obj.profit += profit;
    if (profit < 0) obj.loss += profit;
    if (profit === 0) obj.break_even += profit;
    obj.investment += investment;
    return obj;
  }, INITIAL_STATE);

  const totalRes = leverages.reduce((obj, { profit }) => {
    if (profit > 0) obj.profit += profit;
    if (profit < 0) obj.loss += profit;
    if (profit === 0) obj.break_even += profit;
    return obj;
  }, botRes);

  //   console.log(totalRes);
  return totalRes;
}

export async function calculateBills(id) {
  const INITIAL_STATE = {
    amountPaid: 0,
    amountUnpaid: 0,
    paidBotsNo: 0,
    unpaidBotsNo: 0,
    total: 0,
  };
  const filter = {};
  if (id) filter["user"] = id;

  const bills = await BillingModel.find(filter, { amount: 1, isPaid: 1 });

  return bills?.length > 0
    ? bills.reduce((data, bill) => {
        if (bill["isPaid"] === "Paid") {
          data["paidBotsNo"] += 1;
          data["amountPaid"] += _.round(bill["amount"], 2);
        } else if (["UnPaid", "Pending"].includes(bill["isPaid"])) {
          data["unpaidBotsNo"] += 1;
          data["amountUnpaid"] += _.round(bill["amount"], 2);
        }
        data["total"] += 1;
        return data;
      }, INITIAL_STATE)
    : INITIAL_STATE;
}

export function calculatePercentage(val, total = 1) {
  const per = (val * 100) / total;

  return _.round(per, 3) || 0;
}

export function round3Precision(number) {
  return _.round(number, 3);
}
