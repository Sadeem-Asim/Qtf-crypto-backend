import Binance from "node-binance-api";
import TechnicalIndicators from "technicalindicators";
TechnicalIndicators.setConfig("precision", 7);
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

function calculateSMMA(values, period) {
  if (values.length < period) {
    throw new Error("Not enough data points to calculate SMMA.");
  }

  // Calculate the initial SMA as the average of the first 'period' values
  let smma =
    values.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

  // Calculate SMMA for the remaining values
  for (let i = period; i < values.length; i++) {
    smma = (smma * (period - 1) + values[i]) / period;
  }

  return smma;
}

const checkSignal = (
  smmaHigh,
  smmaLow,
  maShort,
  maLong,
  currentPrice,
  hasPurchasedCoins
) => {
  if (currentPrice > smmaHigh && hasPurchasedCoins === false) {
    if (maShort + 10 > maLong) {
      return { signal: "BUY", smmaHigh };
    } else if (maLong + 10 < maShort) {
      return { signal: "SELL" };
    } else {
      return { signal: "NO" };
    }
  } else {
    if (currentPrice < smmaLow && maShort > maLong) {
      return { signal: "BUY", smmaHigh };
    } else if (currentPrice > smmaHigh && maLong < maShort) {
      return { signal: "SELL" };
    } else {
      return { signal: "NO" };
    }
  }
};

function calculateMA(values, period) {
  const result = TechnicalIndicators.SMA.calculate({ values, period });
  return result[result.length - 1];
}

const getSMA = async (
  symbol = "BTCUSDT",
  interval = "1m",
  hasPurchasedCoins = false
) => {
  try {
    const ticks = await binance.candlesticks(symbol, interval);
    const closes = ticks.map((candle) => parseFloat(candle[4]));
    const low = ticks.map((candle) => parseFloat(candle[3]));
    const high = ticks.map((candle) => parseFloat(candle[2]));
    const currentPrice = parseFloat(ticks[ticks.length - 1][4]);
    const smmaLow = calculateSMMA(low, 100);
    const smmaHigh = calculateSMMA(high, 100);
    const maShort = calculateMA(closes, 9);
    const maLong = calculateMA(closes, 26);

    const res = checkSignal(
      smmaHigh,
      smmaLow,
      maShort,
      maLong,
      currentPrice,
      hasPurchasedCoins
    );
    // we need only high for buying
    // console.log("SMMA Low", smmaLow);
    // console.log("SMMA High", smmaHigh);
    // console.log("MA Low", maShort);
    // console.log("MA High", maLong);

    return res;
  } catch (error) {
    console.error("Error:", error.body ? error.body : error);
  }
};

// Run the bot
export default getSMA;
// setInterval(() => {
//   (async () => {
//     console.log(await getSMA("BTCUSDT", "5m"));
//   })();
// }, 1500);
