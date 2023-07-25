import {Bot} from "#models/bot.model";

export default async function dailyProfitChartAggregate(days = 7) {
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
                createdAt: {
                    $dateToString: {
                        format: "%m/%d/%Y",
                        date: "$setting.createdAt"
                    }
                },
                profit: "$setting.profit"
            }
        },
        {
            $group: {
                _id: "$createdAt",
                profit: {$sum: "$profit"},
                // dates: {$push: "$createdAt"}
            }
        },
        {
            $addFields: {
                startDate: {$min: "$_id"},
            }
        },
        {$limit: days},
        {$sort: {_id: 1}}
    ])
}