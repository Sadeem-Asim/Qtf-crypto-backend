import {Bot} from "#models/bot.model";

const handleBotStatus = async (bot_id) => {

    const match_stage = {"$match": {"_id": bot_id}};
    const lookup_stage = {
        "$lookup": {
            "from": "bot_settings",
            "localField": "setting",
            "foreignField": "_id",
            "as": "setting"
        }
    };
    const unwind_stage = {"$unwind": "$setting"};
    const match_stage2 = {"$match": {"setting.isActive": true}}

    // const pipeline =
    const bot = await Bot.aggregate([
        match_stage,
        lookup_stage,
        unwind_stage,
        match_stage2,
    ])

    if(bot.length === 0) {
        await Bot.findByIdAndUpdate(bot_id, {$set: {isActive: false}})
    }
};


export default handleBotStatus;