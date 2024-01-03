import Binance from "node-binance-api";
import { RSI } from "technicalindicators";
// import { RSI } from "@debut/indicators";
// Replace these with your Binance API key and secret
const apiKey = "YOUR_API_KEY";
const apiSecret = "YOUR_API_SECRET";

const binance = new Binance().options({
  APIKEY: apiKey,
  APISECRET: apiSecret,
  family: 4,
  // If you get timestamp errors, synchronize to server time at the beginning of every API call
});

function calculateUpDownStreak(closePrices, length) {
  let streak = 0;
  for (let i = closePrices.length - length; i < closePrices.length - 1; i++) {
    if (closePrices[i] < closePrices[i + 1]) {
      streak++;
    } else if (closePrices[i] > closePrices[i + 1]) {
      streak--;
    }
  }
  return streak;
}

function calculateStreaksRSI(closePrices, rsiLength) {
  let index = 1;
  let streak = 0;
  let streaks = [];

  for (let i = 1; i < closePrices.length; i++) {
    if (closePrices[i] > closePrices[i - 1]) {
      streak++;
      streaks.push(streak);
    } else if (closePrices[i] < closePrices[i - 1]) {
      streak--;
      streaks.push(streak);
    } else {
      streak = streak + 0;
      streaks.push(streak);
    }
  }
  // console.log(streaks);

  // Calculate RSI on streak lengths
  const streaksRSI = RSI.calculate({
    values: streaks,
    period: 2,
  });

  return streaksRSI[streaksRSI.length - 1];
}

function calculateROC(closePrices) {
  const rocValues = closePrices.map((price, index) =>
    index > 0 ? (price - closePrices[index - 1]) / closePrices[index - 1] : 0
  );
  const currentRoc = rocValues.pop();
  console.log(currentRoc);
  console.log(rocValues.length);
  let relativeMagnitude = 0;
  for (let index = 0; index < 100; index++) {
    if (rocValues[index] < currentRoc) {
      relativeMagnitude += 1;
    }
  }
  return relativeMagnitude;
}
// Function to calculate Connors RSI
function calculateConnorsRSI(closePrices, rsiLength, updownLength) {
  let updownrsi = calculateStreaksRSI(closePrices.slice(-101), updownLength);
  const rsis = RSI.calculate({
    values: closePrices,
    period: rsiLength,
  });
  const rsi = rsis[rsis.length - 1];
  console.log("Rsi : ", rsi);
  console.log("Updown Rsi", updownrsi);

  const percentRank = calculateROC(closePrices.slice(-101));
  console.log("Percent Rank : ", percentRank);
  const crsi = (rsi + updownrsi + percentRank) / 3;
  return { crsi };
}

// Main function to fetch data and calculate Connors RSI
async function main() {
  const symbol = "BTCUSDT";
  const interval = "5m";

  try {
    let ticks = await binance.candlesticks(symbol, interval);
    const currentPrice = parseFloat(ticks[ticks.length - 1][4]);
    const closePrices = ticks.map((candle) => parseFloat(candle[4]));
    console.log("Current Price : ", currentPrice);
    // Example usage

    const rsiLength = 3;
    const upDownLength = 2;
    const rocLength = 100;
    // console.log(calculateUpDownStreak(closePrices, 100));
    const result = calculateConnorsRSI(
      closePrices,
      rsiLength,
      upDownLength,
      rocLength
    );
    console.log("cRsi:", result.crsi);

    // console.log(
    //   `Connors RSI for ${symbol} in ${interval} timeFrame: ${connorsRSI}`
    // );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
setInterval(() => {
  main();
}, 1000);
