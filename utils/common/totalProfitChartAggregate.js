import {Bot} from "#models/bot.model";

export default async function totalProfitChartAggregate(days = 7, filterOption = {}) {
    const group = {
        profit: {$sum: "$profit"},
        dates: {$push: "$createdAt"}
    }

    if (days === 7) {
        group['_id'] = {
            week: {$week: "$createdAt"}
        }
    } else if (days === 14) {
        group['_id'] = {
            $subtract: [
                {$subtract: ["$date", new Date()]},
                {
                    $mod: [
                        {$subtract: ["$date", new Date()]},
                        1000 * 60 * 60 * 24 * 14
                    ]
                }
            ]
        }
    } else {
        group['_id'] = {
            month: {$month: "$createdAt"}
        }
    }

    return Bot.aggregate([
        {
            $lookup: {
                from: "bot_settings",
                localField: "setting",
                foreignField: "_id",
                as: "setting"
            }
        },
        {
            $unwind: "$setting"
        },
        {
            $project: {
                createdAt: "$setting.createdAt",
                profit: "$setting.profit"
            }
        },
        {$sort: {createdAt: 1}},
        {$group: group},
        {
            $addFields: {
                startDate: {$min: "$dates"},
            }
        },
        {
            $project: {
                profit: "$profit",
                startDate: {$dateToString: {format: "%m/%d/%Y", date: "$startDate"}}
            }
        },
        {
            $unset: [
                "dates",
                // "endDate"
            ]
        }
    ]);
}

