import Binance from "node-binance-api";
import { RSI, Stochastic } from "technicalindicators";

// Replace these with your Binance API key and secret
const apiKey = "YOUR_API_KEY";
const apiSecret = "YOUR_API_SECRET";

const binance = new Binance().options({
  APIKEY: apiKey,
  APISECRET: apiSecret,
  family: 4,
  // If you get timestamp errors, synchronize to server time at the beginning of every API call
});

// Function to calculate streaks RSI
function calculateStreaksRSI(closePrices, rsiLength, streakLength) {
  const changes = closePrices.map((price, index) =>
    index > 0 ? price - closePrices[index - 1] : 0
  );

  let streaks = [];
  let currentStreak = changes[0] > 0 ? "up" : "down";
  let currentStreakLength = 1;

  for (let i = 1; i < changes.length; i++) {
    if (
      (changes[i] > 0 && currentStreak === "up") ||
      (changes[i] < 0 && currentStreak === "down")
    ) {
      currentStreakLength++;
    } else {
      streaks.push({ direction: currentStreak, length: currentStreakLength });
      currentStreak = changes[i] > 0 ? "up" : "down";
      currentStreakLength = 1;
    }
  }

  // Add the last streak
  streaks.push({ direction: currentStreak, length: currentStreakLength });

  // Extract the lengths of the desired streak direction
  const selectedStreakLengths = streaks
    .filter(
      (streak) => streak.direction === "up" || streak.direction === "down"
    )
    .map((streak) => streak.length);

  // Calculate RSI on streak lengths
  const streaksRSI = RSI.calculate({
    values: selectedStreakLengths,
    period: rsiLength,
  });

  return streaksRSI[streaksRSI.length - 1];
}

// Example usage

async function main() {
  const symbol = "BTCUSDT";
  const interval = "15m";

  try {
    let ticks = await binance.candlesticks(symbol, interval);
    const currentPrice = parseFloat(ticks[ticks.length - 1][4]);
    const closePrices = ticks.map((candle) => parseFloat(candle[4]));
    console.log("Current Price : ", currentPrice);
    // Example usage
    const rsiLength = 2; // Adjust as needed
    const streakLength = 1; // Adjust as needed

    const streaksRSI = calculateStreaksRSI(
      closePrices,
      rsiLength,
      streakLength
    );
    console.log("Streaks RSI:", streaksRSI[streaksRSI.length - 1]);

    // console.log(
    //   `Connors RSI for ${symbol} in ${interval} timeframe: ${connorsRSI}`
    // );
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the main function
setInterval(() => {
  main();
}, 1000);
