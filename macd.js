import Binance from "node-binance-api";
import TechnicalIndicators from "technicalindicators";

// Replace these with your Binance API key and secret
const apiKey = "YOUR_API_KEY";
const apiSecret = "YOUR_API_SECRET";

const binance = new Binance().options({
  APIKEY: apiKey,
  APISECRET: apiSecret,
  family: 4,
  // If you get timestamp errors, synchronize to server time at the beginning of every API call
});
// atleast 3 difference between macd and signal
// You can choose other intervals like '1m', '5m', '15m', '1h', '1d', etc.

const calculateMACD = (candles) => {
  const closes = candles.map((candle) => parseFloat(candle[4]));
  const macdInput = {
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };

  const result = TechnicalIndicators.MACD.calculate(macdInput);
  return result;
};

const checkSignal = (macdValues) => {
  const lastMACD = macdValues[macdValues.length - 1];

  console.log(lastMACD);
  if (lastMACD.MACD > lastMACD.signal) {
    return "BUY";
  } else if (lastMACD.MACD < lastMACD.signal) {
    return "SELL";
  } else {
    return "No";
  }
};

const runBot = async (symbol = "BTCUSDT", interval = "1m") => {
  try {
    const ticks = await binance.candlesticks(symbol, interval);
    const macdValues = calculateMACD(ticks);
    const res = checkSignal(macdValues);
    return res;
  } catch (error) {
    console.error("Error:", error.body ? error.body : error);
  }
};

// Run the bot
(async () => {
  setInterval(async () => {
    const result = await runBot("BTCUSDT", "5m");
    console.log(result);
  }, 1000);
})();
// console.log(
//   {
//     i: investment,
//     t: time,
//     hasPurchasedCoins: hasPurchasedCoins,
//     signal: signal,
//     macd: macd,
//   },
//   "MACD"
// );
// console.log(macdValue, macdUpdatedAt);

// if (signal === "BUY") {
//   if (macd < macdValue) {
//     await BotSetting.findByIdAndUpdate(
//       setting_id,
//       {
//         macd: false,
//       },
//       { new: true }
//     );
//   } else {
//     await BotSetting.findByIdAndUpdate(
//       setting_id,
//       {
//         macd: true,
//       },
//       { new: true }
//     );
//   }
//   let momentum = false;
//   console.log("RAW.MACD", macdValue);
//   const currentDateTime = moment();
//   const specifiedDateTime = moment(macdUpdatedAt);
//   const differenceInMinutes = currentDateTime.diff(
//     specifiedDateTime,
//     "minutes"
//   );
//   console.log(differenceInMinutes);

//   if (TIME[time] === differenceInMinutes) {
//     if (macd < macdValue) {
//       console.log("Sell Plz Less Than The Previous Value");
//       await BotSetting.findByIdAndUpdate(
//         setting_id,
//         {
//           macd: false,
//           macdValue: macd,
//           macdUpdatedAt: Date.now(),
//         },
//         { new: true }
//       );
//       momentum = true;
//     } else {
//       console.log("Wait Greater than the previous value");
//       await BotSetting.findByIdAndUpdate(
//         setting_id,
//         {
//           // hasPurchasedCoins: true,
//           macd: true,
//           macdValue: macd,
//           macdUpdatedAt: Date.now(),
//         },
//         { new: true }
//       );
//     }
//   }
//   console.log("Momentum : ", momentum);
// } else {

// }

// return;
// if (signal === "SELL") {
//   await BotSetting.findByIdAndUpdate(
//     setting_id,
//     {
//       macd: true,
//     },
//     { new: true }
//   );
// }
// if (signal === "BUY") {
//   await BotSetting.findByIdAndUpdate(
//     setting_id,
//     {
//       macd: true,
//     },
//     { new: true }
//   );
// }
// return;
