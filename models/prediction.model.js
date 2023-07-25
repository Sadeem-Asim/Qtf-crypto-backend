/*****  Packages  *****/
import mongoose from "mongoose";
import Joi from "joi";
import {COINS} from "#constants/index";

/*****  Modules  *****/

const predictionSchema = new mongoose.Schema({
    change: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        enum: COINS,
        required: true,
    }
});

const PredictionModel = mongoose.model('prediction', predictionSchema)

const predictionValidation = (prediction) => {
    const schema = Joi.object({
        price: Joi.number().required(),
        change: Joi.number().required(),
        date: Joi.date().required(),
        currency: Joi.string().valid(...COINS).insensitive().required()
    });

    return schema.validate(prediction);
};

export {PredictionModel, predictionValidation as validate}