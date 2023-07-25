import _ from "lodash"
import {Bot} from "#models/bot.model";

const assignProfit = async (bots = []) => {
    const hasBots = bots.length > 0;

    if (hasBots) {
        return await Promise.all(bots.map(async (bot) => {
            const {setting} = bot;

            const result = await Bot.aggregate([
                {$match: {setting: {$in: setting}}},
                {$lookup: {from: "bot_settings", localField: "setting", foreignField: "_id", as: "setting"}},
                {$unwind: "$setting"},
                {$project: {profit: "$setting.profit", runningAssets: "$setting.investment"}},
                {$group: {_id: "$id", total: {"$sum": "$profit"}, runningAsset: {$sum: "$runningAssets"}}},
                {$project: {_id: false}},
            ]);


            const total = result[0]?.total;
            const runningAssets = result[0]?.runningAsset

            bot['profit'] = _.round(total, 3);
            bot['runningAsset'] = runningAssets;

            return bot;
        }));
    } else return [];
}

export default assignProfit