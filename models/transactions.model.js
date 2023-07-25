/*****  Packages  *****/
import Joi from 'joi'
import mongoose from "mongoose";
import JoiObjectId from "joi-objectid";

/*****  Modules  *****/

const mongoose_id = JoiObjectId(Joi)

const transactionSchema = new mongoose.Schema({
    symbol: String,
    orderId: String,
    clientOrderId: String,
    cummulativeQuoteQty: Number,
    transactTime: Number,
    price: Number,
    qty: Number,
    tradeId: Number,
    status: String,
    timeInForce: String,
    type: String,
    side: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    bot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bot'
    },
    total: {
        type: Number,
        default: 0
    }
},{timestamps: true});

const Transaction = mongoose.model('transaction', transactionSchema);

const transactionValidation = (data) => {
    const schema = Joi.object({
        qty: Joi.number(),
        // .required(),
        type: Joi.string(),
        // .required(),
        side: Joi.string(),
        // .required(),
        price: Joi.number(),
        // .required(),
        status: Joi.string(),
        // .required(),
        symbol: Joi.string(),
        // .required(),
        tradeId: Joi.number(),
        // .required(),
        orderId: Joi.number(),
        // .required(),
        timeInForce: Joi.string(),
        // .required(),
        transactTime: Joi.number(),
        // .required(),
        clientOrderId: Joi.string(),
        // .required(),
        user: mongoose_id(),
        // .required(),
        bot: mongoose_id().required(),
    });

    return schema.validate(data);
};

export {Transaction, transactionValidation as validate}