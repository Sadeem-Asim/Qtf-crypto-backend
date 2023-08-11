import { Bot } from "#models/bot.model";
import { EXCHANGES, INDICATORS } from "#constants/index";
import sellOrder from "#utils/binance/sellOrder";
import stopBot from "#utils/binance/stopBot";
import buyOrder from "#utils/binance/buyOrder";
import fetchRSIValues from "#utils/taapi/fetchRSIValues";
import _ from "lodash";
import inRange from "#utils/common/inRange";
import { BotSetting } from "#models/bot_setting.model";
import { DefaultLogger, WebsocketClient } from "binance";
global.goToRsi = true;

export default function binanceLib() {
  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };
  const wsClient = new WebsocketClient(
    {
      beautify: true,
      wsUrl: "wss://stream.binance.us:9443",
      // Disable ping/pong ws heartbeat mechanism (not recommended)
      // disableHeartbeat: true
    },
    logger
  );

  wsClient.on("formattedMessage", async (data) => {
    const { symbol, kline } = data;
    const { close } = kline;
    // console.log(symbol);
    const currentPrice = _.round(close);
    const coin = symbol === "BTCUSDT" ? "BTC" : "ETH";

    // console.log({currentPrice, coin,symbol})
    await cb({ currentPrice, coin, symbol });
  });

  wsClient.subscribeSpotKline("BTCUSDT", "1s");
  // wsClient.subscribeSpotKline("ETHUSDT", "1s");
}

const cb = _.debounce(
  async ({ currentPrice, coin, symbol }) => {
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
            } = setting;

            const stopCondition = currentPrice <= stop_at;
            const sellCondition = currentPrice >= up;
            //NOTE:: Automatic Bot Operations block
            if (operation === "AUTO") {
              // NOTE:: INDICATORS[1] = 'TRAILING'
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
                    await stopBot({ setting_id, currentPrice });
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
                    await stopBot({ setting_id, currentPrice });
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
                    await stopBot({ setting_id, currentPrice });
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
                    await stopBot({ setting_id, currentPrice });
                  }
                }
              }
            } // Manual Bot Block
            else {
              // NOTE:: MANUAL LOGGER
              console.log(
                { u: up, l: low, c: currentPrice, s: stop_at, r: bots.length },
                "M"
              );

              const min = symbol === "ETHUSDT" ? low - 2 : low - 2;
              const max = symbol === "ETHUSDT" ? low : low;
              const buyCondition = inRange(currentPrice, min, max);
              // const buyCondition = low === currentPrice;
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
                  await stopBot({ setting_id, currentPrice });
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
                await stopBot({ setting_id, currentPrice });
              }
            }
          })
        )
      : 0;
  },
  1200,
  { maxWait: 2000, trailing: true }
);
