import _ from "lodash";

import {Bot} from "#models/bot.model";
import {BotSetting, validate} from "#models/bot_setting.model";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";

/**
 @desc     Create bot setting
 @route    GET /api/admin/setup_bot
 @access   Private (Admin)
 */
const createBotSetting = asyncHandlerMiddleware(async (req, res) => {
    const {error} = validate(req.body);

    if (error) {
        const errors = error?.details.map(err => err.message);
        return res.status(400).send(errors)
    }


    const setting = await new BotSetting(_.pick(req.body, ["operation", "indicator_type", "risk_type", "low", "up", "time", "configured_by", "user_id"])).save();

    return setting ? res.status(201).send("Bot setting created successfully") : res.status(400).send("Something went wrong")
});

/**
 @desc     Update bot setting
 @route    PUT /api/admin/setup_bot/:id
 @access   Private (Admin)
 */
const updateBotSetting = asyncHandlerMiddleware(async (req, res) => {
    const id = req.params.id;

    const record = await BotSetting.findByIdAndUpdate(id, req.body, {new: true});
    await Bot.findOneAndUpdate({setting: id}, {$set: {isActive: req.body?.isActive, status: true}})

    if (!record)
        return res.status(200).send(`Bot with id ${id} does not exist`);

    res.status(200).send('Bot successfully configured');

});


export {createBotSetting, updateBotSetting}