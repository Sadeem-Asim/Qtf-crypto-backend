import mongoose, { Schema } from "mongoose";

const MainSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "leverageHistory",
    },
    coin: {
      type: String,
      required: true,
    },
    side: {
      type: String,
      enum: ["BUY", "SELL"],
    },
    balance: { type: Number },
    type: {
      type: String,
      enum: ["Market", "Limit", "Qtf Leverage"],
      default: "Market",
    },
    hasPurchasedCoins: {
      type: Boolean,
      default: true,
    },
    leverage: {
      type: Number,
    },
    price: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    buy: {
      type: Number,
      default: 0,
    },
    sell: {
      type: Number,
      default: 0,
    },
    profit: {
      type: Number,
      default: 0,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at" } }
);

const Main = mongoose.model("Main", MainSchema);

export { Main };
