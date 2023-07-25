/*****  Packages  *****/
import _ from "lodash";
/*****  Modules  *****/
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import {PredictionModel, validate} from "#models/prediction.model";

/**
 @desc     Save PredictionModel
 @route    POST /api/prediction
 @access   Private
 */

const savePrediction = asyncHandlerMiddleware(async (req, res) => {
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    req['body']['currency'] = req['body']['currency'].toUpperCase();
    await new PredictionModel(_.pick(req.body, ['change', 'date', 'price', 'currency'])).save();

    res.status(200).send('prediction record saved')
});

/**
 @desc     GET PredictionModel
 @route    GET /api/prediction
 @access   Private
 */
const getPrediction = asyncHandlerMiddleware(async (req, res) => {
    const currency = req?.query?.currency;
    const filter = {$and: [{currency: currency}]}

    const predictions = await PredictionModel.find(filter);
    res.status(200).send(predictions);
})


export {savePrediction, getPrediction}