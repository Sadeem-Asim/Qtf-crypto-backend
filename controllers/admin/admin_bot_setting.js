import {UserModel} from "#models/user.model";
import {subAdminUsers} from "#models/sub_admin_users"
import {BotSetting} from "#models/bot_setting.model";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";


const getAllIndicator = asyncHandlerMiddleware(async (req, res) => {

    let type = req.query.type
    const indicator = await BotSetting.find({indicator_type: type});

    if (!indicator)
        return res.status(404).send('bot_settings_indicator doest not exists')
    res.status(200).send(indicator)
})

const getAllsubAdminUser = asyncHandlerMiddleware(async (req, res) => {

    const subAdminUser = await subAdminUsers.find({sub_admin_id: req.params.id});
    res.status(200).send(subAdminUser)

})




export {
    getAllIndicator,
    getAllsubAdminUser,
};