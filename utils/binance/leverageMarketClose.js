import { UserModel } from "#models/user.model";
import { LeverageHistory } from "#models/leverageHistoryModel";
import Binance from "node-binance-api";
import extractApiKeys from "#utils/common/extractApiKeys";
import createProfitForLeverage from "#utils/profit_loss/createProfitForLeverage";

const leverageMarketClose = async ({ id, coin }) => {
  try {
    console.log(id, coin);
    const user = await UserModel.findById(id);
    const { apiKey, secret } = extractApiKeys(user?.api);
    console.log(apiKey, secret);
    const binance = new Binance().options({
      APIKEY: apiKey,
      APISECRET: secret,
      family: 4,
    });
    let result;
    // const allOrders = await binance.futuresAllOrders(coin);
    const risks = await binance.futuresPositionRisk();
    for (let risk of risks) {
      if (risk.symbol === coin) {
        result = risk;
        console.log(risk);
        // result.side = allOrders[allOrders.length - 1]?.side;
        if (Number(result.positionAmt) > 0) {
          result.side = "BUY";
        } else {
          result.side = "SELL";
        }
        break;
      }
    }
    let quantity = result.positionAmt;
    // let pnl = result.unRealizedProfit;
    let type = result.side;
    // entryPrice = _.round(entryPrice, 8);
    let response = {};
    if (type === "BUY") {
      response = await binance.futuresMarketSell(coin, quantity, {
        newOrderRespType: "RESULT",
      });
    } else if (type === "SELL") {
      quantity = quantity.slice(1, quantity.length);
      console.log(quantity);
      response = await binance.futuresMarketBuy(coin, quantity, {
        newOrderRespType: "RESULT",
      });
    }
    if (response?.status === "FILLED") {
      const trades = await binance.futuresUserTrades(coin);
      const trade = trades[trades.length - 1];
      const profit = Number(trade.realizedPnl) - Number(trade.commission);
      console.log(user.leverage);
      console.log(response);
      user.leverage = 0;
      user.save();

      if (type === "BUY") {
        const leverage = await LeverageHistory.findOne({
          user: id,
          coin,
          side: type,
          active: true,
        });
        if (leverage) {
          leverage.sell = response.avgPrice;
          leverage.profit += profit;
          leverage.active = false;
          await leverage.save();
          console.log(leverage);
          createProfitForLeverage(id, coin, leverage.profit);
        }
      } else if (type === "SELL") {
        const leverage = await LeverageHistory.findOne({
          user: id,
          coin,
          side: type,
          active: true,
        });
        if (leverage) {
          leverage.buy = response.avgPrice;
          leverage.profit += profit;
          leverage.active = false;
          await leverage.save();
          console.log(leverage);
          createProfitForLeverage(id, coin, leverage.profit);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export default leverageMarketClose;
