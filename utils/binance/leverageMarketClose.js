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
      console.log(user.leverage);
      console.log(response);
      user.leverage = 0;
      user.save();

      if (type === "BUY") {
        const leverage = await LeverageHistory.findOne({
          user: id,
          coin,
          side: type,
          // buy: entryPrice,
          active: true,
        });
        if (leverage) {
          let balanceAfterMarketClose = 0;
          const futureBalance = await binance.futuresBalance();
          for (let i = 0; i < futureBalance.length; i++) {
            if (futureBalance[i].asset === "USDT") {
              balanceAfterMarketClose = futureBalance[i].balance;
              console.log("Future Balance : ", futureBalance[i].balance);
              break;
            }
          }
          let pnl = Number(balanceAfterMarketClose) - leverage.balance;
          leverage.sell = response.avgPrice;
          leverage.profit = pnl;
          leverage.active = false;
          leverage.save();
          console.log(leverage);
          createProfitForLeverage(id, coin, pnl);
        }
      } else if (type === "SELL") {
        const leverage = await LeverageHistory.findOne({
          user: id,
          coin,
          side: type,
          active: true,
        });
        if (leverage) {
          let balanceAfterMarketClose = 0;
          const futureBalance = await binance.futuresBalance();
          for (let i = 0; i < futureBalance.length; i++) {
            if (futureBalance[i].asset === "USDT") {
              balanceAfterMarketClose = futureBalance[i].balance;
              console.log("Future Balance : ", futureBalance[i].balance);
              break;
            }
          }
          let pnl = Number(balanceAfterMarketClose) - leverage.balance;
          leverage.buy = response.avgPrice;
          leverage.profit = pnl;
          leverage.active = false;
          leverage.save();
          console.log(leverage);
          createProfitForLeverage(id, coin, pnl);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export default leverageMarketClose;
