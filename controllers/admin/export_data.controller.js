import json2xls from 'json2xls';
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import {Bot} from "#models/bot.model";
import assignProfit from "#utils/common/assignProfit";
import {DOMAIN, STAGES} from "#constants/index";
import path, {dirname} from "path";
import * as fs from "fs";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 @desc     Export Bot Data
 @route    GET /api/admin/export/bot
 @access   Private (Admin)
 */

const exportBotData = asyncHandlerMiddleware(async (req, res) => {
    const records = [];
    const bots = await Bot.find(
        {},
        {
            exchange: 1,
            coin: 1,
            investment: 1,
            risk: 1,
            day: 1,
            profit: 1,
            user: 1,
            setting: 1
        }
    ).populate('user', 'name');
    const _bots = await assignProfit(bots);

    const result = _bots.map((bot, index) => ({
        'ID': index + 1,
        'USER': bot['user']['name'],
        'SYMBOL': bot['coin'],
        'EXCHANGE': bot['exchange'],
        'INVESTMENT': bot['investment'],
        'RISK': STAGES[bot['risk']],
        'DAY': bot['day'],
        'PROFIT': bot['profit'],
    }))

    const xls = json2xls(result);
    const folder = path.resolve('') + '/data/';
    const filename = `${Date.now()}.xlsx`
    const fullPath = folder + filename
    const downloadPath = DOMAIN + `data/${filename}`

    console.log({folder,filename, fullPath,downloadPath})

    fs.writeFileSync(fullPath, xls, 'binary');

    res.status(200).send(downloadPath);
});


export {exportBotData}