import { UserModel } from "#models/user.model";
import { LeverageHistory } from "#models/leverageHistoryModel";
import Binance from "node-binance-api";
import extractApiKeys from "#utils/common/extractApiKeys";
import createProfitForLeverage from "#utils/profit_loss/createProfitForLeverage";

function truncateToDecimals(num, dec = 3) {
  let calcDec = Math.pow(10, dec);
  calcDec = Math.trunc(num * calcDec) / calcDec;
  return calcDec;
}

const leverageMarketOpen = async ({ id, coin, orderId, markPrice }) => {
  try {
    // let {
    //   id,
    //   leverage,
    //   amount,
    //   reduceOnly,
    //   coin,
    //   side,
    //   tpsl,
    //   takeProfit,
    //   balance,
    // } = req.body;
    const user = await UserModel.findById(id);

    const { apiKey, secret } = extractApiKeys(user?.api);
    console.log(apiKey, secret);
    const binance = new Binance().options({
      APIKEY: apiKey,
      APISECRET: secret,
      family: 4,
    });
    let order = await LeverageHistory.findById(orderId);

    // console.log(futurePrice);
    let quantity = (order.amount * order.leverage) / markPrice;
    quantity = truncateToDecimals(quantity);
    console.log(quantity);
    console.info(await binance.futuresLeverage(coin, order.leverage));
    console.info(await binance.futuresMarginType(coin, "ISOLATED"));
    // console.log("REDUCE ONLY ", reduceOnly);
    console.log("Type : ", order.side);
    let response = {};

    if (order.side === "BUY") {
      response = await binance.futuresMarketBuy(coin, quantity, {
        newOrderRespType: "RESULT",
      });
    } else if (order.side === "SELL") {
      response = await binance.futuresMarketSell(coin, quantity, {
        newOrderRespType: "RESULT",
      });
    }

    if (response?.status === "FILLED") {
      order.hasPurchasedCoins = true;
      const trades = await binance.futuresUserTrades(coin);
      const trade = trades[trades.length - 1];
      const profit = Number(trade.realizedPnl) - Number(trade.commission);
      console.log(user.leverage);
      order.amount = parseFloat(order.amount);
      console.log(user.leverage + order.amount);
      user.leverage = user.leverage + order.amount;
      await user.save();
      console.log(response);
      console.log(response.side);
      console.log(response.avgPrice);
      let buy,
        sell = 0;
      if (response.side === "BUY") {
        buy = response.avgPrice;
        order.buy = buy;
      } else if (response.side === "SELL") {
        sell = response.avgPrice;
        order.sell = sell;
      }
      order.profit += profit;
      order.hasPurchasedCoins = true;
      await order.save();
    }
  } catch (error) {
    console.log(error);
  }
};

export default leverageMarketOpen;
