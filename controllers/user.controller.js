/*****  Packages  *****/
import _ from "lodash";
import bcrypt from "bcrypt";

/*****  Modules  *****/
import { UserModel, validate } from "#models/user.model";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";

import { subAdminUsers } from "#models/sub_admin_users";
import { Bot } from "#models/bot.model";
import { calculateTotalProfit } from "#utils/common/calculations";
import { LeverageHistory } from "#models/leverageHistoryModel";

/**
 @desc     Register new UserModel
 @route    POST /api/users
 @access   Public
 */
const registerUser = asyncHandlerMiddleware(async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new UserModel(_.pick(req.body, ["name", "email", "password", "role"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  if (user?.role === "SUB_ADMIN") {
    try {
      await new subAdminUsers({ sub_admin: user?._id }).save();
    } catch (e) {
      res.statusCode = 400;
      throw new Error(e);
    }
  }
  await user.save();

  const token = user.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .status(201)
    .send(_.pick(user, ["_id", "name", "email", "role"]));
});

/**
 @desc     Retrieve Registered UserModel
 @route    GET /api/users/me
 @access   Private (UserModel)
 */
const getUser = asyncHandlerMiddleware(async (req, res) => {
  const user = await UserModel.findById(req.user?._id).select("-password");
  res.send(user);
});

/**
 @desc     Update UserModel Profile
 @route    PUT /api/users/:id
 @access   Private (UserModel)
 */
const updateUser = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;

  const user = await UserModel.findById(id);

  if (!user) return res.status(404).send("User doest not exists");

  await UserModel.findByIdAndUpdate(id, _.pick(req.body, "name", "email"));

  res.status(200).send("Profile updated Successfully ");
});

const getAllUser = asyncHandlerMiddleware(async (req, res) => {
  const filter = { role: "USER" };
  const role = req.user?.role;
  console.log(role);
  console.log(req.user);
  if (role === "SUB_ADMIN") {
    const subAdmin = await subAdminUsers.findOne({ sub_admin: req?.user?._id });
    filter["_id"] = { $in: subAdmin?.users };
  }

  const users = await UserModel.find(filter).select("+role -active").lean();

  if (!users) return res.status(404).send("User doest not exists");

  const _users = await Promise.all(
    users.map(async (user) => {
      // console.log(user);
      const bots = await Bot.find({ user }).populate("setting");
      const record = await Bot.findOne(
        {},
        { createdAt: 1 },
        { sort: { createdAt: 1 } }
      );
      const { createdAt: createdDate } = record || {};

      const totalProfit = await Promise.all(
        bots.map(async ({ setting }) =>
          setting.reduce((profit, row) => profit + row["profit"], 0)
        )
      );
      let leverages = await LeverageHistory.find({
        user: user._id,
      });

      let leverageProfit = leverages.reduce(calculateTotalProfit, 0);
      // console.log("Leverages Profit : ", leverageProfit);
      totalProfit.push(leverageProfit);
      return { ...user, profit: _.sum(totalProfit), createdDate: createdDate };
    })
  );

  res.status(200).send(_users);
});

const getAllUnAssignedUser = asyncHandlerMiddleware(async (req, res) => {
  const user = await UserModel.find({ role: "USER" }).select("+role -active");

  if (!user) return res.status(404).send("User doest not exists");

  res.status(200).send(user);
});

/**
 @desc     Save Api Keys
 @route    PUT /api/users/api_keys
 @access   Private (User)
 */
const saveApiKeys = asyncHandlerMiddleware(async (req, res) => {
  const { binance, ku_coin } = req.body;

  const _id = req.user?._id;
  const user = await UserModel.findByIdAndUpdate(
    _id,
    { api: { binance, ku_coin } },
    { new: true }
  );

  user.token = user.generateAuthToken();
  res.status(200).send({
    message: "APIs successfully Updates",
    user: _.pick(user, ["name", "email", "role", "_id", "token", "api"]),
  });
});

const getApiKeys = asyncHandlerMiddleware(async (req, res) => {
  const _id = req.user?._id;

  const user = await UserModel.findById(_id);

  if (user) return res.status(200).send(user?.api);

  res.status(404).send(`User not found with id ${_id}`);
});

export {
  registerUser,
  getUser,
  updateUser,
  getAllUser,
  getAllUnAssignedUser,
  saveApiKeys,
  getApiKeys,
};
