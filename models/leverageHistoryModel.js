import mongoose, { Schema } from "mongoose";

const LeverageHistorySchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    coin: {
      type: String,
      required: true,
    },
    side: {
      type: String,
      enum: ["BUY", "SELL"],
    },
    buy: {
      type: Number,
    },
    sell: {
      type: Number,
    },
    profit: {
      type: Number,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at" } }
);

const LeverageHistory = mongoose.model(
  "leverageHistory",
  LeverageHistorySchema
);

export { LeverageHistory };
