import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import { Bot } from "#models/bot.model";
import { EXCHANGES } from "#constants/index";
import binanceCloseOrder from "#utils/binance/binanceCloseOrder";
import { UserModel } from "#models/user.model";
import { subAdminUsers } from "#models/sub_admin_users";
import assignProfit from "#utils/common/assignProfit";
import extractApiKeys from "#utils/common/extractApiKeys";
import getBinanceParams from "#utils/binance/getBinanceParams";
import binanceApi from "#services/binance";
import Binance from "node-binance-api";

import _ from "lodash";
// import kuCoinApi from "#services/kucoin";

/**
 @desc     Delete User Bot
 @route    DELETE /api/admin/bot/:id
 @access   Private (Admin)
 */
const deleteBot = asyncHandlerMiddleware(async (req, res) => {
  const id = req.params.id;

  const bot = await Bot.findById(id, {
    setting: 1,
    exchange: 1,
    user: 1,
  }).populate("setting", "investment low up isActive hasPurchasedCoins profit");

  if (!bot) return res.status(200).send(`No Record Found`);

  const { exchange, user } = bot || {};

  exchange === EXCHANGES[0]
    ? await binanceCloseOrder({ bot_id: id, user_id: user }) //  BINANCE EXCHANGE
    : {}; //  KUCOIN EXCHANGE

  await Bot.findByIdAndUpdate(id, { $set: { isDeleted: true } });
  res.status(200).send("Bot Successfully Deleted");
});

/**
 @desc     Activity Record Bots
 @route    GET /api/admin/activity
 @access   Private (Admin)
 */
const botsActivity = asyncHandlerMiddleware(async (req, res) => {
  let filter = {
    role: "User",
  };
  console.log(req?.user);
  const { role } = req?.user;
  if (role === "SUB_ADMIN") {
    const subAdmin = await subAdminUsers.findOne({ sub_admin: req?.user?._id });
    filter["_id"] = { $in: subAdmin?.users };
  }
  const users = await UserModel.find(filter, [
    "name",
    "email",
    "api",
    "role",
    "leverage",
  ]).lean();
  // console.log(users);
  filter = {};
  const updatedRecord = await Promise.all(
    users.map(async (user) => {
      const { _id, role } = user;
      const balances = {};
      const futureBalances = {};

      if (role === "SUB_ADMIN") {
        const subAdmin = await subAdminUsers.findOne({ sub_admin: _id });
        filter["user"] = { $in: subAdmin?.users };
      } else {
        filter["user"] = _id;
      }
      const bots = await Bot.find(filter)
        .populate("user")
        .populate(
          "setting",
          "risk investment operation low up takeProfit indicator isActive time stats"
        );
      const _bots = await assignProfit(bots);

      try {
        const { apiKey, secret } = extractApiKeys(user?.api);
        // console.log(user?.name);
        // Binance Api Kets
        if (apiKey || secret) {
          const params = getBinanceParams(undefined, secret);
          const { data, status } = await binanceApi.accountInformation(
            params,
            apiKey
          );
          //   console.log(data.balances);
          for (let balance of data?.balances) {
            switch (balance?.asset) {
              case "USDT":
                balances["usdt"] = _.round(balance?.free, 2);
                break;
              default:
            }
            if (Object?.keys(balances)?.length === 1) break;
          }
          //   console.log(apiKey, secret);
          // console.log(balances);
          const binance = new Binance().options({
            APIKEY: apiKey,
            APISECRET: secret,
            family: 4,
          });

          const futureBalance = await binance.futuresBalance();
          for (let element of futureBalance) {
            // console.log(element);
            switch (element?.asset) {
              case "USDT":
                futureBalances["f_usdt"] = _.round(element?.balance, 2);
                break;
              default:
            }
            if (Object?.keys(futureBalances)?.length === 1) break;
          }
          // console.log(futureBalances);
        } else {
          throw new Error("Invalid api key provided");
        }
      } catch (e) {
        const error = e.response?.data || e;
        // console.log({ error });
        // balances["usdt"] = 0;
        balances["btc"] = 0;
        balances["eth"] = 0;
      }

      // try {
      //     const credentials = extractApiKeys(user?.api, 'kucoinApi');

      //     if (
      //         !credentials['apiKey'] ||
      //         !credentials['secret'] ||
      //         !credentials['passphrase']
      //     ) {
      //         throw new Error('Invalid api keys provided')
      //     }

      //     const response = await kuCoinApi.accountInformation({
      //         type: 'trade',
      //     }, credentials);

      //     if (response?.code !== '200000')
      //         throw new Error('Error in kucoin api')

      //     // console.log(Object.values(response.data))

      //     for (const record of response.data) {
      //         switch (record['currency']) {
      //             case 'BTC':
      //                 kucoinBalances['k_btc'] = _.round(record['available'], 2);
      //                 break;
      //             case 'ETH':
      //                 kucoinBalances['k_eth'] = _.round(record['available'], 2);
      //                 break;
      //             case 'USDT':
      //                 kucoinBalances['k_usdt'] = _.round(record['available'], 2);
      //                 break;
      //             default:
      //         }
      //         if (Object?.keys(kucoinBalances)?.length === 3)
      //             break;
      //     }
      // } catch (e) {
      //     const error = e.response?.data || e;
      //     // console.log( { error } );
      //     kucoinBalances['k_usdt'] = 0;
      //     kucoinBalances['k_btc'] = 0;
      //     kucoinBalances['k_eth'] = 0;
      // }

      return { ...user, ...futureBalances, ...balances, bots: _bots };
    })
  );
  res.send(updatedRecord);
});

export { deleteBot, botsActivity };
