import Binance from "node-binance-api";

const binanceSDKInstance = (apiKeys = {}) => {
    const {apiKey = '', secret = ''} = apiKeys;
    return new Binance().options({
        APIKEY: apiKey,
        APISECRET: secret,
        recvWindow: 10000,
        log: (msg) => console.log(msg,'*******************')
    });
};

export default binanceSDKInstance