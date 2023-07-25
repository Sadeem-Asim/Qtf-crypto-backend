/*****  Packages  *****/
import Joi from "joi";
import mongoose, { Schema } from "mongoose";
import JoiObjectId from "joi-objectid";

/*****  Modules  *****/
const mongoose_id = JoiObjectId(Joi);

const billingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    transaction_Id: {
      type: String,
    },
    profitPercentage: {
      type: Number,
      default: 0,
    },
    userProfit: {
      type: Number,
      default: 0,
    },
    amount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isPaid: {
      type: String,
      enum: ["UnPaid", "Paid", "Pending"],
      default: "UnPaid",
    },
    createdBy: Schema.Types.ObjectId,
  },
  { timestamps: true, minimize: false }
);

const BillingModel = mongoose.model("Billing", billingSchema);

const validateUser = (user) => {
  const schema = Joi.object({
    user: mongoose_id().required(),
    profitPercentage: Joi.number().required(),
    userProfit: Joi.number().required(),
    amount: Joi.number().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
  });

  return schema.validate(user);
};

export { BillingModel, validateUser as validate };
