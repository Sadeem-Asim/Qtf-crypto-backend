import { Bot } from "#models/bot.model";
import { EXCHANGES, INDICATORS } from "#constants/index";
import sellOrder from "#utils/binance/sellOrder";
import stopBot from "#utils/binance/stopBot";
import buyOrder from "#utils/binance/buyOrder";
import fetchRSIValues from "#utils/taapi/fetchRSIValues";
import leverageMarketClose from "#utils/binance/leverageMarketClose";
import leverageMarketOpen from "#utils/binance/leverageMarketOpen";
import getMACD from "#utils/binance/getMACDvalue";
import _ from "lodash";
import inRange from "#utils/common/inRange";
import { BotSetting } from "#models/bot_setting.model";
import { DefaultLogger, WebsocketClient } from "binance";
import { LeverageHistory } from "#models/leverageHistoryModel";
import Binance from "node-binance-api";
import moment from "moment";

export default function binanceLib() {
  const binance = new Binance().options({
    APIKEY: "<key>",
    APISECRET: "<secret>",
  });
  binance.futuresMarkPriceStream("BTCUSDT", async (data) => {
    // console.log(data.markPrice);
    const { markPrice } = data;
    // console.log(markPrice);
    await leverage({ markPrice });
  });
  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };
  const wsClient = new WebsocketClient({ beautify: true }, logger);

  wsClient.on("formattedMessage", async (data) => {
    // console.log(data);
    const { symbol, kline } = data;
    const { close } = kline;
    // console.log(data);
    const currentPrice = _.round(close);
    const coin = symbol === "BTCUSDT" ? "BTC" : "ETH";

    // console.log({currentPrice, coin,symbol})
    await cb({ currentPrice, coin, symbol });
  });
  // wsClient.subscribeTrades();
  wsClient.subscribeSpotKline("BTCUSDT", "1s");
  // wsClient.subscribeSpotKline("ETHUSDT", "1s");
}
const leverage = _.debounce(
  async ({ markPrice }) => {
    markPrice = Number(markPrice);
    // console.log("Leverage Mark Price", markPrice);
    const limitOrders = await LeverageHistory.find({
      active: true,
      coin: "BTCUSDT",
      hasPurchasedCoins: false,
    });
    console.log("Total Btc Leverage Limit Open Orders : ", limitOrders.length);

    if (limitOrders.length > 0) {
      limitOrders.forEach(async (order) => {
        let buyCondition = false;
        if (order.side === "BUY") {
          buyCondition = inRange(markPrice, order.price - 3, order.price);
          // sellCondition = markPrice >= order.takeProfit;
        } else if (order.side === "SELL") {
          // buyCondition = markPrice <= order.price;
          buyCondition = inRange(markPrice, order.price + 3, order.price);
          // sellCondition = markPrice <= order.takeProfit;
        }
        // console.log(sellCondition);
        if (buyCondition) {
          // console.log(order);
          console.log(markPrice);
          const buyOrderParams = {
            id: order.user.toString(),
            coin: "BTCUSDT",
            orderId: order._id.toString(),
            markPrice: markPrice,
          };
          console.log(buyOrderParams);
          await leverageMarketOpen(buyOrderParams);
        }
      });
    }

    const leverages = await LeverageHistory.find({
      active: true,
      tpsl: true,
      coin: "BTCUSDT",
      hasPurchasedCoins: true,
    });
    console.log("Total Btc Leverage Open Orders : ", leverages.length);
    if (leverages.length > 0) {
      leverages.forEach(async (leverage) => {
        let sellCondition = false;
        if (leverage.side === "BUY") {
          sellCondition = inRange(
            markPrice,
            leverage.takeProfit + 5,
            leverage.takeProfit
          );
          // sellCondition = markPrice >= leverage.takeProfit;
        } else if (leverage.side === "SELL") {
          sellCondition = inRange(
            markPrice,
            leverage.takeProfit - 5,
            leverage.takeProfit
          );
          // sellCondition = markPrice <= leverage.takeProfit;
        }
        // console.log(sellCondition);
        if (sellCondition) {
          // console.log(leverage);
          console.log(markPrice);
          const sellOrderParams = {
            id: leverage.user.toString(),
            coin: "BTCUSDT",
            // leverage,
          };
          console.log(sellOrderParams);
          await leverageMarketClose(sellOrderParams);
        }
      });
    }
  },
  3000,
  { maxWait: 2000, trailing: true }
);

const TIME = {
  "1m": 1,
  "3m": 3,
  "5m": 5,
  "15m": 15,
  "30m": 16,
  "1h": 16,
  "2h": 16,
  "4h": 16,
  "6h": 16,
  "8 hours": 16,
  "12 hours": 16,
};

const sellTime = {
  "3m": "1m",
  "5m": "3m",
  "15m": "5m",
};

const cb = _.debounce(
  async ({ currentPrice, coin, symbol }) => {
    try {
      // console.log("Hi");
      const bots = await Bot.aggregate([
        {
          $lookup: {
            from: "bot_settings",
            localField: "setting",
            foreignField: "_id",
            as: "setting",
          },
        },
        { $unwind: "$setting" },
        {
          $match: {
            $or: [
              { "setting.low": currentPrice },
              { "setting.up": { $gte: currentPrice } },
              { stop_at: { $lte: currentPrice } },
            ],
            $and: [
              { "setting.isActive": true },
              { isActive: true },
              { status: true },
              { coin: coin },
              { exchange: EXCHANGES[0] },
            ],
          },
        },
      ]);
      console.log("Total Orders Open", bots.length, symbol);
      // console.log(bots);
      bots.length > 0
        ? await Promise.all(
            bots.map(async (bot) => {
              const { setting, stop_at, _id, user } = bot;
              const {
                low,
                up,
                hasPurchasedCoins,
                investment,
                _id: setting_id,
                operation,
                takeProfit,
                indicator,
                time,
                raw,
                macdValue,
                macdUpdatedAt,
              } = setting;
              // if (setting_id.toString() !== "6564aa6b4fededeae2b55d89") return;

              const stopCondition = currentPrice <= stop_at;
              // console.log(stopCondition, stop_at);
              const sellCondition = currentPrice >= up;
              //NOTE:: Automatic Bot Operations block
              if (operation === "AUTO") {
                // NOTE:: INDICATORS[1] = 'TRAILING'
                // return;
                if (indicator === INDICATORS[1]) {
                  // NOTE:: TRAILING LOGGER
                  console.log(
                    {
                      u: up,
                      l: low,
                      c: currentPrice,
                      s: stop_at,
                      r: bots.length,
                    },
                    "T"
                  );

                  //NOTE:: Order Sell Block (TRAILING)
                  if (hasPurchasedCoins) {
                    if (sellCondition) {
                      const sellOrderParams = {
                        symbol,
                        bot_id: _id,
                        setting_id,
                        user_id: user,
                        quantity: raw?.qty,
                        currentPrice,
                      };
                      await sellOrder(sellOrderParams, { raw, investment });
                    } else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                  //NOTE:: Buy & Stop loss Logic Block (TRAILING)
                  else {
                    const min = symbol === "ETHUSDT" ? low - 3 : low - 3;
                    const max = symbol === "ETHUSDT" ? low + 3 : low + 3;

                    const buyCondition = inRange(currentPrice, min, max);
                    // const buyCondition = low === currentPrice;

                    //NOTE:: Buy Logic Block (TRAILING)
                    if (buyCondition) {
                      const buyOrderParams = {
                        symbol,
                        investment,
                        setting_id,
                        bot_id: _id,
                        user_id: user,
                        currentPrice,
                      };
                      await buyOrder(buyOrderParams);
                    }
                    //NOTE::Stop loss Logic Block
                    else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                } else if (indicator === INDICATORS[0]) {
                  // NOTE:: INDICATORS[0] = 'RSI' Block
                  const params = {
                    exchange: EXCHANGES[0], // binance
                    symbol: symbol.replace("USDT", "/USDT"),
                    interval: time,
                  };

                  const rsi = await fetchRSIValues(params);

                  console.log(
                    {
                      u: up,
                      l: low,
                      rsi: _.floor(rsi?.value),
                      c: currentPrice,
                      s: stop_at,
                      r: bots?.length,
                    },
                    "R"
                  );
                  // console.log("RSI ->", _.round(rsi?.value), "BTCUSDT ->", currentPrice);

                  const sellConditionRSI = _.floor(rsi.value) >= up; //NOTE:: RSI overbought condition
                  if (hasPurchasedCoins) {
                    if (sellConditionRSI) {
                      const sellOrderParams = {
                        symbol,
                        bot_id: _id,
                        setting_id,
                        user_id: user,
                        quantity: raw?.qty,
                        currentPrice,
                      };
                      await sellOrder(sellOrderParams, { raw, investment });
                    } else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                  //NOTE:: Buy & Stop loss Logic Block (RSI)
                  else {
                    // const stopCondition = currentPrice <= stop_at;
                    const min = low - 5;
                    console.log(min, low);
                    const buyCondition = inRange(_.round(rsi?.value), min, low); //NOTE:: RSI oversold condition

                    if (buyCondition) {
                      const buyOrderParams = {
                        symbol,
                        investment,
                        setting_id,
                        bot_id: _id,
                        user_id: user,
                        currentPrice,
                      };
                      await buyOrder(buyOrderParams);
                    }
                    //NOTE::Stop loss Logic Block
                    else if (stopCondition) {
                      // await stopBot({ setting_id, currentPrice });
                    }
                  }
                } else if (indicator === INDICATORS[2]) {
                  // MACD BLOCK
                  const { signal, macd } = await getMACD(symbol, time);
                  if (!signal) return;
                  console.log(
                    {
                      i: investment,
                      t: time,
                      hasPurchasedCoins: hasPurchasedCoins,
                      signal: signal,
                      macd: macd,
                    },
                    "MACD"
                  );
                  if (signal === "SELL") {
                    await BotSetting.findByIdAndUpdate(
                      setting_id,
                      {
                        macd: true,
                        macdValue: 0,
                      },
                      { new: true }
                    );
                  } else if (signal === "BUY") {
                    let momentum = false;
                    const currentDateTime = moment();
                    const specifiedDateTime = moment(macdUpdatedAt);
                    const differenceInMinutes = currentDateTime.diff(
                      specifiedDateTime,
                      "minutes"
                    );
                    console.log("Difference In Minutes", differenceInMinutes);

                    if (TIME[time] === differenceInMinutes) {
                      if (macd < macdValue) {
                        console.log("Sell Plz Less Than The Previous Value");
                        await BotSetting.findByIdAndUpdate(
                          setting_id,
                          {
                            macd: false,
                            macdValue: macd,
                            macdUpdatedAt: Date.now(),
                          },
                          { new: true }
                        );
                        momentum = true;
                      } else {
                        console.log("Wait Greater than the previous value");
                        await BotSetting.findByIdAndUpdate(
                          setting_id,
                          {
                            macd: true,
                            macdValue: macd,
                            macdUpdatedAt: Date.now(),
                          },
                          { new: true }
                        );
                      }
                    }
                    console.log("Momentum : ", momentum);
                  }

                  if (hasPurchasedCoins) {
                    let takeProfitCondition = false;
                    // console.log(macdValue, macdUpdatedAt);
                    console.log(takeProfit);
                    if (
                      TIME[time] === 3 ||
                      TIME[time] === 5 ||
                      TIME[time] === 15
                    ) {
                      if (currentPrice < raw.price - 20) {
                        takeProfitCondition = true;
                      }
                      if (takeProfit !== 0) {
                        if (currentPrice <= takeProfit) {
                          takeProfitCondition = true;
                        }
                        if (currentPrice > takeProfit + 10) {
                          await BotSetting.findByIdAndUpdate(
                            setting_id,
                            {
                              takeProfit: currentPrice - 3,
                            },
                            { new: true }
                          );
                        }
                      } else {
                        if (currentPrice > raw.price + 5) {
                          await BotSetting.findByIdAndUpdate(
                            setting_id,
                            {
                              takeProfit: currentPrice - 1,
                            },
                            { new: true }
                          );
                        }
                      }
                      const { signal: signal2 } = await getMACD(
                        symbol,
                        sellTime[time]
                      );

                      if (signal2 === "SELL") {
                        takeProfitCondition = true;
                        await BotSetting.findByIdAndUpdate(
                          setting_id,
                          {
                            macd: false,
                          },
                          { new: true }
                        );
                      }
                    } else {
                      if (takeProfit !== 0) {
                        if (currentPrice < takeProfit) {
                          takeProfitCondition = true;
                        }
                        if (currentPrice > takeProfit + 10) {
                          await BotSetting.findByIdAndUpdate(
                            setting_id,
                            {
                              takeProfit: currentPrice - 3,
                            },
                            { new: true }
                          );
                        }
                      } else {
                        if (currentPrice > raw.price + 10) {
                          await BotSetting.findByIdAndUpdate(
                            setting_id,
                            {
                              takeProfit: currentPrice - 3,
                            },
                            { new: true }
                          );
                        }
                      }
                    }
                    console.log("Take Profit Condition", takeProfitCondition);
                    let sellCondition =
                      signal === "SELL" ||
                      takeProfitCondition ||
                      setting.macd === false;
                    console.log(sellCondition);
                    // return;
                    if (sellCondition) {
                      const sellOrderParams = {
                        symbol,
                        bot_id: _id,
                        setting_id,
                        user_id: user,
                        quantity: raw?.qty,
                        currentPrice,
                      };
                      await sellOrder(sellOrderParams, { raw, investment });
                      await BotSetting.findByIdAndUpdate(
                        setting_id,
                        {
                          takeProfit: 0,
                        },
                        { new: true }
                      );
                    }
                  } else {
                    const buyCondition =
                      signal === "BUY" && setting.macd === true;
                    console.log(buyCondition);
                    // return;
                    if (buyCondition) {
                      const buyOrderParams = {
                        symbol,
                        investment,
                        setting_id,
                        bot_id: _id,
                        user_id: user,
                        currentPrice,
                      };
                      await buyOrder(buyOrderParams);
                      if (macdValue === 0) {
                        await BotSetting.findByIdAndUpdate(
                          setting_id,
                          {
                            hasPurchasedCoins: true,
                            macdValue: macd,
                            macdUpdatedAt: Date.now(),
                          },
                          { new: true }
                        );
                      } else {
                        await BotSetting.findByIdAndUpdate(
                          setting_id,
                          {
                            hasPurchasedCoins: true,
                          },
                          { new: true }
                        );
                      }
                    }
                  }
                }
              } // Manual Bot Block
              else {
                console.log(
                  {
                    u: up,
                    l: low,
                    c: currentPrice,
                    s: stop_at,
                    r: bots.length,
                  },
                  "M"
                );

                const min = symbol === "ETHUSDT" ? low - 2 : low - 5;
                const max = symbol === "ETHUSDT" ? low : low;
                const buyCondition = inRange(currentPrice, min, max);
                // const buyCondition = low === currentPrice;
                // console.log(buyCondition);
                if (hasPurchasedCoins) {
                  const takePriceCondition =
                    currentPrice === takeProfit && takeProfit !== 0;

                  const sellOrderParams = {
                    symbol,
                    bot_id: _id,
                    setting_id,
                    user_id: user,
                    quantity: raw?.qty,
                    currentPrice,
                  };

                  if (takePriceCondition) {
                    await sellOrder(sellOrderParams, {
                      raw,
                      investment,
                      isManual: true,
                    });
                    await BotSetting.findByIdAndUpdate(setting_id, {
                      isActive: false,
                      investment: 0,
                    });
                  } else if (currentPrice >= up) {
                    await sellOrder(sellOrderParams, {
                      raw,
                      investment,
                      isManual: true,
                    });
                    await BotSetting.findByIdAndUpdate(setting_id, {
                      isActive: false,
                      investment: 0,
                    });
                  } else if (stopCondition) {
                    // await stopBot({ setting_id, currentPrice });
                  }
                } else if (buyCondition) {
                  const buyOrderParams = {
                    symbol,
                    investment,
                    setting_id,
                    bot_id: _id,
                    user_id: user,
                    currentPrice,
                  };
                  await buyOrder(buyOrderParams);
                } else if (stopCondition) {
                  // await stopBot({ setting_id, currentPrice });
                }
              }
            })
          )
        : 0;
    } catch (error) {
      console.log(error);
    }
  },
  1200,
  { leading: false, maxWait: 2000, trailing: true }
);
