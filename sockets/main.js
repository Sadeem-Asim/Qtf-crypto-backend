import { Bot } from "#models/bot.model";
import { EXCHANGES, INDICATORS } from "#constants/index";
// import sellOrder from "#utils/binance/sellOrder";
// import stopBot from "#utils/binance/stopBot";
// import buyOrder from "#utils/binance/buyOrder";
// import fetchRSIValues from "#utils/taapi/fetchRSIValues";
// import leverageMarketClose from "#utils/binance/leverageMarketClose";
// import leverageMarketOpen from "#utils/binance/leverageMarketOpen";

import inRange from "#utils/common/inRange";
import _ from "lodash";
// import { BotSetting } from "#models/bot_setting.model";
import { DefaultLogger, WebsocketClient } from "binance";
import { LeverageHistory } from "#models/leverageHistoryModel";
import { Main } from "#models/mainModel";

import Binance from "node-binance-api";

export default function main() {
  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };
  const wsClient = new WebsocketClient(
    {
      beautify: true,
      // wsUrl: "wss://ws-api.binance.com:443/ws-api/v3",
      // Disable ping/pong ws heartbeat mechanism (not recommended)
      // disableHeartbeat: true
    },
    logger
  );

  wsClient.on("formattedMessage", async (data) => {
    // console.log(data);
    const { symbol, kline } = data;
    const { close } = kline;
    // console.log(symbol);
    const currentPrice = _.round(close);
    const coin = symbol === "BTCUSDT" ? "BTC" : "ETH";

    // console.log({currentPrice, coin,symbol})
    await cb({ currentPrice, coin, symbol });
  });
  // wsClient.subscribeTrades();
  wsClient.subscribeSpotKline("BTCUSDT", "1s");
  // wsClient.subscribeSpotKline("ETHUSDT", "1s");
}
const apiKey =
  "EZk6qWCiEC6q1HkCA1Z9lobpPsL5dmETRARR7YQMFknSfcUX8uj0VVunxjDptId7";
const secret =
  "66LZIQasbzbritL2j45kehDnTLfsEOqNYSlbfrinhTIlB0eLfLY1x0r9ZWKoRFgG";
const cb = _.debounce(
  async ({ currentPrice, coin, symbol }) => {
    try {
      //   console.log(currentPrice);
      let startDate = new Date("2023-10-31T10:42:45.816+00:00");
      //   console.log(startDate);
      let userHistory = await LeverageHistory.find({
        user: "6537acbb4152222f62da36b3",
        // user: "653cbf9cef35c63e7863691e",
        active: true,
        hasPurchasedCoins: true,
        created_at: { $gt: startDate },
        coin: "ETHUSDT",
      });
      console.log(userHistory);
      let clientHistory = await Main.find({
        active: true,
        hasPurchasedCoins: true,
      });
      console.log(clientHistory);

      let clientHistoryIds = clientHistory.map((history) =>
        history.user.toString()
      );
      //   console.log(clientHistoryIds);
      userHistory.length > 0
        ? await Promise.all(
            userHistory.map(async (history) => {
              let { id, amount, coin, leverage, side, type } = history;

              if (clientHistoryIds.includes(id)) {
                console.log("No Order");
                return;
              } else {
                console.log(false);
                let amountInOrder;
                const binance = new Binance().options({
                  APIKEY: apiKey,
                  APISECRET: secret,
                  family: 4,
                });
                const futureBalance = await binance.futuresBalance();
                const { availableBalance } = futureBalance.find((element) => {
                  if (element.asset === "USDT") {
                    console.log("Future Balance : ", element.balance);
                    return element.balance;
                  }
                });
                console.log(availableBalance);
                if (Number(availableBalance) < 1) {
                  return;
                }
                if (Number(availableBalance) < Number(amount)) {
                  amountInOrder = Number(availableBalance);
                } else {
                  amountInOrder = Number(amount);
                }
                console.log("Amount In Order: ", amountInOrder);
                // else we are going to buy that history and create the new history

                const futurePrices = await binance.futuresPrices();
                let futurePrice = futurePrices[coin];
                console.log("Future Price", futurePrice);
                let quantity = (amountInOrder * leverage) / futurePrice;
                quantity = truncateToDecimals(quantity);
                console.log("Quantity : ", quantity);
                console.info(await binance.futuresLeverage(coin, leverage));
                console.info(await binance.futuresMarginType(coin, "ISOLATED"));
                // return;
                let response = {};
                if (side === "BUY") {
                  console.log("Type : ", side);

                  response = await binance.futuresMarketBuy(coin, quantity, {
                    newOrderRespType: "RESULT",
                  });
                } else if (side === "SELL") {
                  console.log("Type : ", side);

                  response = await binance.futuresMarketSell(coin, quantity, {
                    newOrderRespType: "RESULT",
                  });
                }
                console.log("Response : ", response);

                if (response?.status === "FILLED") {
                  const trades = await binance.futuresUserTrades(coin);
                  const trade = trades[trades.length - 1];
                  const profit =
                    Number(trade.realizedPnl) - Number(trade.commission);
                  console.log(profit);

                  amount = parseFloat(amountInOrder);
                  let buy,
                    sell = 0;
                  if (response.side === "BUY") {
                    buy = response.avgPrice;
                  } else if (response.side === "SELL") {
                    sell = response.avgPrice;
                  }
                  createLeverageStats(
                    id,
                    coin,
                    response.side,
                    buy,
                    sell,
                    profit,
                    availableBalance,
                    type,
                    leverage,
                    amount
                  );
                }
              }
            })
          )
        : 0;
      clientHistory.length > 0
        ? await Promise.all(
            clientHistory.map(async (history) => {
              const { user } = history;
              const userHistory = await LeverageHistory.findById(user);
              const { id, amount, coin, leverage, side, buy, sell } =
                userHistory;
              console.log("User History", userHistory);
              console.log(clientHistoryIds);
              if (clientHistoryIds.includes(id)) {
                console.log(id, amount, coin, leverage, side, buy, sell);
                const binance = new Binance().options({
                  APIKEY: apiKey,
                  APISECRET: secret,
                  family: 4,
                });
                let result;
                if (side === "BUY") {
                  if (sell === 0) {
                    console.log("No Order");
                    return;
                  }
                } else if (side === "SELL") {
                  if (buy === 0) {
                    console.log("No Order");
                    return;
                  }
                }
                console.log("SADEEM");

                // const allOrders = await binance.futuresAllOrders(coin);
                const risks = await binance.futuresPositionRisk();
                for (let risk of risks) {
                  if (risk.symbol === coin) {
                    result = risk;
                    console.log(risk);
                    // result.side = allOrders[allOrders.length - 1]?.side;
                    if (Number(result.positionAmt) > 0) {
                      result.side = "BUY";
                    } else {
                      result.side = "SELL";
                    }
                    break;
                  }
                }
                let quantity = result.positionAmt;
                // let pnl = result.unRealizedProfit;
                let type = result.side;
                // entryPrice = _.round(entryPrice, 8);
                let response = {};
                if (type === "BUY") {
                  response = await binance.futuresMarketSell(coin, quantity, {
                    newOrderRespType: "RESULT",
                  });
                } else if (type === "SELL") {
                  quantity = quantity.slice(1, quantity.length);
                  console.log(quantity);
                  response = await binance.futuresMarketBuy(coin, quantity, {
                    newOrderRespType: "RESULT",
                  });
                }
                console.log(response);

                if (response?.status === "FILLED") {
                  const trades = await binance.futuresUserTrades(coin);
                  const trade = trades[trades.length - 1];
                  const profit =
                    Number(trade.realizedPnl) - Number(trade.commission);

                  if (type === "BUY") {
                    const leverage = await Main.findOne({
                      user: id,
                      coin,
                      side: type,
                      active: true,
                    });

                    leverage.sell = response.avgPrice;
                    leverage.profit += profit;
                    leverage.active = false;
                    await leverage.save();
                  } else if (type === "SELL") {
                    const leverage = await Main.findOne({
                      user: id,
                      coin,
                      side: type,
                      active: true,
                    });
                    leverage.buy = response.avgPrice;
                    leverage.profit += profit;
                    leverage.active = false;
                    await leverage.save();
                  }
                }
              } else {
                console.log("No Order");
                return;
              }
            })
          )
        : 0;
    } catch (error) {
      console.log(error);
    }
  },
  5000,
  { maxWait: 3000, trailing: true }
);

function truncateToDecimals(num, dec = 3) {
  let calcDec = Math.pow(10, dec);
  calcDec = Math.trunc(num * calcDec) / calcDec;
  return calcDec;
}

async function createLeverageStats(
  id,
  coin,
  side,
  buy = 0,
  sell = 0,
  profit = 0,
  balance = 0,
  type = "Market",
  leverage = 0,
  amount = 0
) {
  const newStat = await Main.create({
    user: id,
    coin,
    side,
    buy,
    sell,
    profit,
    balance,
    type,
    leverage,
    amount,
  });
  console.log(newStat);
}
