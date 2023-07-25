import {Bot} from "#models/bot.model";
import closeSingleOrderBinance from "#utils/binance/closeSingleOrderBinance";

const binanceCloseOrder = async ({bot_id, user_id}) => {
    const bot = await Bot.findById(bot_id);

    if (!bot) // if bot not found
        throw new Error(`Bot doesn't exist with id ${bot_id}`)

    const {coin, setting: setting_ids} = bot;

    return await Promise.all(setting_ids.map(async (_setting_id) => {
        const setting_id = typeof _setting_id === "object"
            ? _setting_id.toHexString()
            : _setting_id

        return await closeSingleOrderBinance({bot_id, user_id, setting_id});
    }));
};

export default binanceCloseOrder