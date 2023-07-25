import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import {PurchaseStats} from "#models/purchasing_stats.model";


const getAllPurchaseStats = asyncHandlerMiddleware(async (req, res) => {
    const stats = await PurchaseStats.find();
    res.status(200).send(stats);
});

const getPurchaseStatsByIndicator = asyncHandlerMiddleware(async (req, res) => {
    const indicator = req.params.indicator;
    const stats = await PurchaseStats.find({indicator});
    res.status(200).send(stats);
});


export {getAllPurchaseStats, getPurchaseStatsByIndicator};