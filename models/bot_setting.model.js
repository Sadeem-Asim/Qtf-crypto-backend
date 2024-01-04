/*****  Packages  *****/
import Joi from "joi";
import mongoose from "mongoose";
import JoiObjectId from "joi-objectid";

/*****  Modules  *****/
import { INDICATORS, OPERATION, RISKS } from "#constants/index";

const mongoose_id = JoiObjectId(Joi);

const botSettingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    indicator: {
      type: String,
      enum: INDICATORS,
      uppercase: true,
    },
    risk: {
      type: String,
      enum: RISKS,
      required: true,
    },
    investment: {
      type: Number,
      required: true,
    },
    operation: {
      type: String,
      enum: OPERATION,
      required: true,
    },
    low: {
      type: Number,
      default: 0,
      required: true,
    },
    up: {
      type: Number,
      default: 0,
      required: true,
    },
    time: {
      type: String,
    },
    isActive: {
      type: Boolean,
      required: false,
    },
    hasPurchasedCoins: {
      type: Boolean,
      default: false,
      required: true,
    },
    profit: {
      type: Number,
      default: 0,
    },
    raw: mongoose.Schema.Types.Mixed,
    takeProfit: {
      type: Number,
      default: 0,
    },
    stats: {
      buy: [Number],
      sell: [Number],
      profit: [Number],
    },
    macd: {
      type: Boolean,
      default: true,
    },
    macdUpdatedAt: { type: Date, default: Date.now },
    macdValue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const BotSetting = mongoose.model("Bot_setting", botSettingSchema);

const botSettingValidation = (setting) => {
  const schema = Joi.object({
    time: Joi.string(),
    configured_by: Joi.string(),
    up: Joi.number().required(),
    low: Joi.number().required(),
    investment: Joi.number().required(),
    risk: Joi.string()
      .valid(...RISKS)
      .required(),
    operation: Joi.string()
      .valid(...OPERATION)
      .required(),
    indicator: Joi.string()
      .valid(...INDICATORS)
      .insensitive(),
    isActive: Joi.bool().required(),
    user: mongoose_id().required(),
    takeProfit: Joi.string(),
    profit: Joi.number(),
    raw: Joi.any(),
  });
  return schema.validate(setting);
};

export { BotSetting, botSettingValidation as validate };
