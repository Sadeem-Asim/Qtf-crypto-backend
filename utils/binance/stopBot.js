import winston from "winston";
import {BotSetting} from "#models/bot_setting.model";

const stopBot = async ({setting_id, currentPrice}) => {
    // Save Bot Stopped status in Binance log file
    winston.debug(`Bot with id ${setting_id} has been stopped at Price ${currentPrice}`)
    // Stop the bot active status;
    await BotSetting.findByIdAndUpdate(setting_id, {isActive: false})
    console.log('STOPPED')
}


export default stopBot;