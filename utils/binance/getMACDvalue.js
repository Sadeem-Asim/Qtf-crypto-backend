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
    return { signal: "BUY", macd: lastMACD.histogram };
  } else if (lastMACD.MACD < lastMACD.signal) {
    return { signal: "SELL", macd: lastMACD.histogram };
  } else {
    return { signal: "", macd: "" };
  }
};

const getMACD = async (symbol = "BTCUSDT", interval = "1m") => {
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
export default getMACD;
