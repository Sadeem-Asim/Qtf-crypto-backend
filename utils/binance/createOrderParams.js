import getBinanceParams from "#utils/binance/getBinanceParams";

const createOrderParams = ({symbol, investment, quantity,}, secret = '', isSellOrder) => {
    const _params = {type: "MARKET", symbol};

    if (isSellOrder) {
        _params['quantity'] = quantity;
        _params['side'] = 'SELL';
    } else {
        _params['quoteOrderQty'] = investment
        _params['side'] = 'BUY';
    }

    return getBinanceParams(_params, secret)
}

export default createOrderParams