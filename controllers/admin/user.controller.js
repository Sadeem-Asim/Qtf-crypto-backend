import _ from "lodash";
import bcrypt from "bcrypt";

import { Bot } from "#models/bot.model";
import { EXCHANGES } from "#constants/index";
import { UserModel } from "#models/user.model";
import { BotSetting } from "#models/bot_setting.model";
import { Transaction } from "#models/transactions.model";
import { PredictionModel } from "#models/prediction.model";
import binanceCloseOrder from "#utils/binance/binanceCloseOrder";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { BillingModel } from "#models/billing-modal";
import { Profit } from "#models/ProfitModel";
import { subAdminUsers } from "#models/sub_admin_users";

/**
 @desc     GET Users API
 @route    GET /api/admin/user/:id
 @access   Private (Admin)
 */
const getUser = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const user = await UserModel.findById(id);

  if (user) return res.status(200).send(_.pick(user, ["api", "email", "name"]));

  res.status(400).send("User not found");
});

/**
 @desc     Update Users API
 @route    PUT /api/admin/user/:id
 @access   Private (Admin)
 */
const updateUser = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const user = await UserModel.findByIdAndUpdate(
    id,
    _.pick(req.body, ["name", "email", "api"])
  );

  if (user) return res.status(200).send("Successfully updated");

  res.status(400).send("User not found");
});

/**
 @desc     Delete User
 @route    DELETE /api/admin/user/:id
 @access   Private (Admin)
 */
const deleteUser = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const record = await UserModel.findByIdAndDelete(id);

  if (record) return res.status(200).send("Successfully Deleted");

  res.status(400).send("User not found");
});

/**
 @desc     GET User Api setting
 @route    GET /api/admin/user_api_keys/:id
 @access   Private (Admin)
 */
const userApiSetting = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const apiKeys = await UserModel.findById(id, { api: 1 });

  return apiKeys
    ? res.status(200).send(apiKeys)
    : res.status(400).send("some error occurred");
});

/**
 @desc     Update User API setting
 @route    PUT /api/admin/user_api_keys/:id
 @access   Private (Admin)
 */
const updateUserApiSetting = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const apiKeys = await UserModel.findByIdAndUpdate(
    id,
    _.pick(req.body, ["api"]),
    { new: true }
  );

  return apiKeys
    ? res.status(200).send("API Keys successfully updated")
    : res.status(400).send("some error occurred");
});

/**
 @desc     Delete User and Close All Their Orders
 @route    DELETE /api/admin/user/delete_user_orders/:id
 @access   Private (Admin)
 */
const deleteUserOrders = asyncHandlerMiddleware(async (req, res) => {
  const user_id = req.params.id;
  const user = await UserModel.findById(user_id);

  if (!user)
    // if user not found
    return res.status(400).send("User not found");

  const bots = await Bot.find({ user: user_id });

  if (bots.length === 0) {
    await UserModel.findByIdAndDelete(user_id);
    return res.status(200).send("User Successfully Deleted");
  }

  const result = await Promise.all(
    bots.map(async (bot) => {
      const { exchange, _id: botId } = bot;

      return exchange === EXCHANGES[0]
        ? await binanceCloseOrder({ bot_id: botId, user_id })
        : {}; //  BINANCE EXCHANGE
    })
  );

  await UserModel.findByIdAndDelete(user_id);

  res.status(200).send("User Successfully Deleted");
});

const clearData = asyncHandlerMiddleware(async (req, res) => {
  await BillingModel.deleteMany();
  await Bot.deleteMany();
  await BotSetting.deleteMany();
  await PredictionModel.deleteMany();
  await Profit.deleteMany();
  await subAdminUsers.deleteMany();
  await Transaction.deleteMany();
  await UserModel.deleteMany();

  await new UserModel({
    name: "Admin",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("12345678", 10),
    role: "ADMIN",
    active: true,
  }).save();

  res.send("Data Successfully Deleted");
});

export {
  deleteUser,
  getUser,
  updateUser,
  userApiSetting,
  updateUserApiSetting,
  deleteUserOrders,
  clearData,
};
