import Binance from "node-binance-api";
import TechnicalIndicators from "technicalindicators";
import _ from "lodash";
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

function calculateEMA(closes) {
  const input = {
    values: closes,
    period: 9,
  };
  const emaResult = new TechnicalIndicators.EMA.calculate(input);

  return emaResult;
}
function calculateStochRSI(closes, period = 14) {
  const inputStochRSI = {
    values: closes,
    rsiPeriod: period,
    stochasticPeriod: period,
    kPeriod: 3,
    dPeriod: 3,
  };
  const stochRsiResult = new TechnicalIndicators.StochasticRSI(inputStochRSI);
  return stochRsiResult.getResult();
}

const getScRsi = async (symbol = "BTCUSDT", interval = "1m") => {
  try {
    let signal = "NO";
    let ticks = await binance.candlesticks(symbol, interval);
    const currentPrice = parseFloat(ticks[ticks.length - 1][4]);
    // console.log(ticks[ticks.length - 1]);
    // console.log("Current Price: " + currentPrice);
    const closes = ticks.map((candle) => parseFloat(candle[4]));

    const res1 = calculateEMA(closes);
    const res2 = calculateStochRSI(closes);
    const ema = res1[res1.length - 1];
    let rsi = res2[res2.length - 1];
    rsi.k = _.round(rsi.k, 2);
    rsi.d = _.round(rsi.d, 2);
    // console.log(rsi);

    // console.log("EMA : ", ema);
    if (currentPrice > ema) {
      if (rsi.k >= rsi.d) {
        signal = "BUY";
      }
    }
    if (rsi.k < rsi.d) {
      signal = "SELL";
    }
    // console.log(signal);
    return signal;
  } catch (error) {
    console.error("Error:", error.body ? error.body : error);
  }
};

// Run the bot
export default getScRsi;
