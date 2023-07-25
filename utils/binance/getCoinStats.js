import _ from "lodash";

const getCoinStats = async (symbol, binance) => {
    return await new Promise((resolve, reject) => {
        binance.websockets.prevDay(symbol, (error, response) => {
            if (error) {
                reject(`Error in getCoinStats, ${error}`)
                return;
            }
            const data = {}
            const {
                priceChange,
                percentChange,
                averagePrice,
                close,
                bestBid,
                high,
                low,
                volume,
                numTrades
            } = response;

            data['low'] = _.round(low, 2).toFixed(2);
            data['high'] = _.round(high, 2).toFixed(2);
            data['close'] = _.round(close, 2).toFixed(2);
            data['volume'] = _.round(volume, 2).toFixed(2);
            data['bestBid'] = _.round(bestBid, 2).toFixed(2);
            data['change'] = _.round(priceChange, 2).toFixed(2);
            data['numTrades'] = _.round(numTrades, 2).toFixed(2);
            data['averagePrice'] = _.round(averagePrice, 2).toFixed(2);
            data['changePercentage'] = _.round(percentChange, 2).toFixed(2);

            resolve(data);
        });
    }).then(response => response)
        .catch(error => console.log({error}))
};

export default getCoinStats