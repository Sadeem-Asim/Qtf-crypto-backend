import {RISKS} from "#constants/index";
import {Profit} from "#models/ProfitModel";
import moment from "moment/moment.js";

const _RISK = {7: RISKS[0], 15: RISKS[1], 30: RISKS[2]};

export default async function profitLoss(days = undefined, filter = {}) {
    const today = moment().startOf('day').toDate();
    const risk = _RISK[days];

    const $match = days
        ? {...filter, risk}
        : {...filter, created_at: {$gte: today}}

    const $group = {
        _id: "$created_at",
        profit: {$sum: {$cond: [{'$gt': ['$value', 0]}, "$value", 0]}},
        loss: {$sum: {$cond: [{'$lt': ['$price', 0]}, "$price", 0]}},
    }

    return Profit.aggregate([
        {$match},
        {$group},
    ])
}