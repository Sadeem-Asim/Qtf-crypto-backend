/*****  Packages  *****/
import mongoose from "mongoose";
import Joi from "joi";
import JoiObjectId from "joi-objectid";

/*****  Modules  *****/
import {COINS, EXCHANGES, INDICATORS, RISKS} from "#constants/index";

const mongoonse_id = JoiObjectId(Joi)

const botSchema = new mongoose.Schema({
    indicator: {
        type: String,
        enum: INDICATORS,
        uppercase: true,
    },
    risk: {
        type: String,
        enum: RISKS,
        required: true
    },
    exchange: {
        type: String,
        enum: EXCHANGES,
        required: true,
    },
    coin: {
        type: String,
        enum: COINS,
        required: true
    },
    stop_at: {
        type: Number,
        required: true
    },
    investment: {
        type: Number,
        required: true,
    },
    day: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    profit: {
        type: Number,
        default: 0,
    },
    loss: {
        type: Number,
        default: 0,
    },
    status: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    setting: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Bot_setting'
    }],
    configured_by: {
        type: String,
        default: 'not configured'
    },
    availableBalance: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

botSchema.statics.findByUser = function (user) {
    return this.find({user})
};

botSchema.pre('find', function () {
    this.where({isDeleted: false})
});

const Bot = mongoose.model('Bot', botSchema);

// Bot Validation
const botValidation = (bot) => {
    const schema = Joi.object({
        risk: Joi.string().valid(...RISKS).required(),
        coin: Joi.string().valid(...COINS).required(),
        exchange: Joi.string().valid(...EXCHANGES).required(),
        day: Joi.number().required(),
        user: mongoonse_id().required(),
        stop_at: Joi.number().required(),
        investment: Joi.number().required(),
        setting: Joi.array().items(mongoonse_id()),
        availableBalance: Joi.number(),
        price: Joi.number(),
        isActive: Joi.boolean()
    });


    return schema.validate(bot);
}

export {Bot, botValidation as validate}
