import _ from "lodash";
import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { BillingModel, validate } from "#models/billing-modal";
import { UserModel } from "#models/user.model";
import { Bot } from "#models/bot.model";
import assignProfit from "#utils/common/assignProfit";
import dateRange from "#utils/common/dateRangeCheck";

/**
 @desc     GET Billing API
 @route    GET /api/admin/bill/:id
 @access   Private (Admin)
 */
const getBilling = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const user = await UserModel.findById(id);

  if (!user) return res.status(404).send("User doest not exists");

  const userBilling = await BillingModel.find({ user: id }).populate("user");
  if (userBilling.length > 0) {
    return res.status(200).send(userBilling);
  } else {
    return res.status(404).send("No record found");
  }
});

/**
 @desc     Create User Bill API
 @route    PUT /api/admin/bill
 @access   Private (Admin)
 */
const createBilling = asyncHandlerMiddleware(async (req, res) => {
  const { error } = validate(req.body);

  const userId = req?.body?.user;
  console.log(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  const user = await UserModel.findById(userId);
  if (!user) return res.status(404).send("User doest not exists");

  if (!(req.body?.startDate <= req.body?.endDate))
    return res.status(400).send("End date must be greater than start date");

  //Calculating Valid Bill Days

  const billingValidRange = await BillingModel.find({ user: userId });
  console.log(billingValidRange, "billingValidRange");
  const validBillDate = billingValidRange.map(({ startDate, endDate }) =>
    dateRange(startDate, endDate, req.body.startDate, req.body.endDate)
  );
  if (validBillDate.includes(true)) {
    return res.status(400).send("Bill is already created from this date");
  }
  const bots = await Bot.find({
    user: userId,
    createdAt: {
      $gte: new Date(req.body.startDate),
      $lte: new Date(req.body.endDate),
    },
  });
  const _bots = await assignProfit(bots);

  let profitCalculate = _bots.reduce(
    (obj, { profit }) => {
      if (profit > 0) obj.profit += profit;
      return obj;
    },
    { profit: 0 }
  );
  const percentageValue = req.body?.amountPercentage / 100;
  const calculateProfitAmount = _.round(
    profitCalculate?.profit * percentageValue,
    3
  ); //Calculating % from total profit

  console.log(percentageValue, "profitCalculate");

  console.log(calculateProfitAmount, "calculateProfitAmount");

  console.log(req.body, "BODY");
  const userBilling = new BillingModel({ ...req.body });
  await userBilling.save();
  if (userBilling) return res.status(201).send("Successfully Created Bill");
});

/**
 @desc     Update User Bill Paid Status 
 @route    PUT /api/users-update-status/:id
 @access   Private (UserModel)
 */
const updateUserPaidStatus = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;

  const userBill = await BillingModel.findById(id);

  if (!userBill) return res.status(404).send("User Bill does not exists");

  await BillingModel.findByIdAndUpdate(id, { $set: { isPaid: "Paid" } });

  res.status(200).send("User Paid Status updated Successfully ");
});

/**
 @desc     Update User Bill Reciept  
 @route    PUT /api/users-update-recipt/:id
 @access   Private (UserModel)
 */
const updateUserBillRecipt = asyncHandlerMiddleware(async (req, res) => {
  const id = req.body?.bill_Id;
  const userBill = await BillingModel.findById(id);

  if (!userBill) return res.status(404).send("User Bill does not exists");

  console.log(req.body)
  await BillingModel.findByIdAndUpdate(id, {
    $set: { isPaid: "Pending", transaction_Id: req.body?.transaction_Id },
  });

  res.status(200).send("User Bill Recipt Added Successfully ");
});

/**
 @desc     Delete User bill
 @route    DELETE /api/admin/bill/:id
 @access   Private (Admin)
 */
const deleteUserBill = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;
  const record = await BillingModel.findByIdAndDelete(id);

  if (record) return res.status(200).send("Successfully Deleted");

  res.status(400).send("User Bill not found");
});

export {
  createBilling,
  getBilling,
  updateUserPaidStatus,
  deleteUserBill,
  updateUserBillRecipt,
};
