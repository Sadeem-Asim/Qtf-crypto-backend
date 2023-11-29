import _ from "lodash";

import { Bot } from "#models/bot.model";
import { myLogger } from "#utils/logger";
import binanceApi from "#services/binance";
import { UserModel } from "#models/user.model";
import { BotSetting } from "#models/bot_setting.model";
import { Transaction } from "#models/transactions.model";
import extractApiKeys from "#utils/common/extractApiKeys";
import handleBotStatus from "#utils/common/handleBotStatus";
import createOrderParams from "#utils/binance/createOrderParams";
import { Profit } from "#models/ProfitModel";
import { BOT_STATUS, EXCHANGES } from "#constants/index";
import cache from "#utils/common/Cache";

const decimalCount = (num) => {
  // Convert to String
  const numStr = String(num);
  // String Contains Decimal
  if (numStr.includes(".")) {
    return numStr.split(".")[1].length;
  }
  // String Does Not Contain Decimal
  return 0;
};

const sellOrder = async (
  { symbol, quantity, bot_id, user_id, setting_id, currentPrice },
  { raw, investment, risk = "LOW", isManual = false }
) => {
  const { api } = await UserModel.findById(user_id, { "api.binance": 1 });
  const { apiKey, secret } = extractApiKeys(api);
  // Order Sell Params
  const params = createOrderParams(
    {
      symbol,
      quantity,
    },
    secret,
    true
  );

  cache.set(_.toString(setting_id), BOT_STATUS.COIN_SOLD);

  // Order Sell API
  await binanceApi
    .createOrder(params, apiKey)
    // Block Run if Order Successfully Sold
    .then(async (response) => {
      // Save Response in kucoin log file
      myLogger.binance.info(JSON.stringify(response?.data));
      //Destructuring Transaction Data
      const { fills, cummulativeQuoteQty: size, ...restData } = response?.data;
      const { price, tradeId } = fills[0];
      const doc = {
        ...restData,
        price,
        size,
        tradeId,
        bot: bot_id,
        user: user_id,
      };

      const profit = _.round(Number(size), 3) - _.round(raw.size, 3);
      const availableBalance = Number(investment) + Number(profit);

      await new Profit({
        bot: bot_id,
        user: user_id,
        risk,
        exchange: EXCHANGES[0],
        coin: symbol.replace("USDT", ""),
        value: profit,
      }).save();

      // Update Bot Setting that Order was Sold

      if (isManual) {
        //NOTE:: Updating BotSetting in Manual Configuration
        await BotSetting.findByIdAndUpdate(setting_id, {
          $inc: { profit: profit },
          $unset: { raw: 1 },
          $set: { isActive: false, investment: 0, hasPurchasedCoins: false },
          $push: { "stats.sell": Number(price) },
        });
        //NOTE:: Updating Bot in Manual Configuration
        await Bot.findByIdAndUpdate(bot_id, {
          $inc: { availableBalance: availableBalance },
        });
      } else {
        //NOTE:: Updating BotSetting in RSI and Trailing Configuration
        await BotSetting.findByIdAndUpdate(setting_id, {
          $set: { hasPurchasedCoins: false },
          $inc: { profit: profit },
          $unset: { raw: 1 },
          $push: { "stats.sell": Number(price) },
        });
        //NOTE:: Updating Bot in RSI and Trailing Configuration
        await Bot.findByIdAndUpdate(bot_id, {
          $inc: { availableBalance: profit },
        });
      }

      /*TODO:: Remove this testing Logger*/
      myLogger.binanceTesting.error(
        JSON.stringify({
          side: "sell",
          setting_id,
          price: price,
          size: restData.cummulativeQuoteQty,
          profit,
          investment,
          oldQty: raw.size,
          availableBalance,
        })
      );
      // Create the Transaction of Order
      await new Transaction({ ...doc, setting_id }).save();
      await handleBotStatus(bot_id);
      console.log("SOLD");
      return true;
    })
    // Block Run if Order has been failed with some issue
    .catch(async (error) => {
      if (error.response.data.code === -2010) {
        if (symbol === "BTCUSDT") {
          let setting = await BotSetting.findById(setting_id);
          setting.raw.qty = _.round(
            setting.raw.qty - 0.00001,
            decimalCount(setting.raw.qty)
          );
          await setting.save();
          // await BotSetting.findByIdAndUpdate(setting_id, {
          //   $inc: { "raw.qty": -0.00001 },
          // });
        } else if (symbol === "ETHUSDT") {
          let setting = await BotSetting.findById(setting_id);
          setting.raw.qty = _.round(
            setting.raw.qty - 0.0001,
            decimalCount(setting.raw.qty)
          );
          await setting.save();

          // await BotSetting.findByIdAndUpdate(setting_id, {
          //   $inc: { "raw.qty": -0.0001 },
          // });
        }
      }
      const _error = _.get(error, "response.data.msg", error);
      myLogger.binanceError.error("Sell Order Failed");
      myLogger.binanceError.error(JSON.stringify(error));
      console.log(
        _error,
        "Sell Order Failed",
        symbol,
        quantity,
        bot_id,
        user_id,
        setting_id
      );
      return false;
    });
};

export default sellOrder;
