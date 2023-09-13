import _ from "lodash";

import { Bot } from "#models/bot.model";
import sellOrder from "#utils/binance/sellOrder";
import { BotSetting } from "#models/bot_setting.model";

const closeSingleOrderBinance = async ({ bot_id, user_id, setting_id }) => {
  try {
    const bot = await Bot.findById(bot_id);

    if (!bot)
      // if bot not found
      throw new Error(`Bot doesn't exist with id ${bot_id}`);

    const { coin, risk } = bot;

    const bot_setting = await BotSetting.findOne({
      _id: setting_id,
      isActive: true,
    });

    if (_.isEmpty(bot_setting))
      // if bot not found
      return `Bot Setting doesn't exist with id ${setting_id}`;

    ///NOTE:: ==========        CONDITION FOR CHECKING BOT HAS PURCHASED COINS      ==========
    if (_.isEmpty(bot_setting?.raw))
      return BotSetting.findByIdAndUpdate(setting_id, {
        $set: { isActive: false },
      });

    ///NOTE:: ==========        STARTING CLOSING BINANCE ORDER      ==========

    const symbol = coin + "USDT";
    const { investment, raw } = bot_setting;

    const sellOrderParams = {
      symbol,
      bot_id,
      user_id,
      setting_id,
      quantity: raw?.qty,
    };

    await sellOrder(sellOrderParams, { raw, investment, isManual: true, risk });
    await BotSetting.findByIdAndUpdate(setting_id, {
      $set: { hasPurchasedCoins: false, isActive: false, investment: 0 },
    });

    return true;
  } catch (error) {
    console.log(error);
  }
};

export default closeSingleOrderBinance;
