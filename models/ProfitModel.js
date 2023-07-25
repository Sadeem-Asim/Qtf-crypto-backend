import mongoose, {Schema} from "mongoose";
import {COINS, EXCHANGES} from "#constants/index";


const ProfitSchema = new mongoose.Schema({
    bot: {
        type: Schema.Types.ObjectId,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        required: true
    },
    exchange: {
        type: String,
        enum: EXCHANGES,
        required: true,
    },
    coin: {
        type: String,
        required: true
    },
    risk: String,
    value: {
        type: Schema.Types.Number,
        required: true,
    },

}, {timestamps: {createdAt: 'created_at'}});

const Profit = mongoose.model('profit', ProfitSchema)

export {Profit}