import _ from "lodash";

const getBinanceCoinPrice = (symbol, binance) => {
  return binance
    .prices(symbol)
    .then((response) => {
      const price = response?.[symbol] || 0;
      return _.round(price, 2);
    })
    .catch((e) => {
      // console.log(`Error in getBinanceCoinPrice(${symbol})`, e.message);
      return _.round(0, 2);
    });
};

export default getBinanceCoinPrice;
