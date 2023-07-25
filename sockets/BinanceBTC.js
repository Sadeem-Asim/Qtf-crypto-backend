import _ from "lodash";
import {DefaultLogger, WebsocketClient} from "binance";
import main from "#sockets/Binance/main";

export default function BinanceBTC() {
    const logger = {
        ...DefaultLogger,
        silly: (...params) => {
            // console.log(params)
        },
    };

    const wsClient = new WebsocketClient(
        {
            beautify: true,
            // Disable ping/pong ws heartbeat mechanism (not recommended)
            // disableHeartbeat: true
        },
        logger
    );

    wsClient.on('formattedMessage', (data) => {
        const {symbol, kline} = data;
        const {close} = kline;

        const currentPrice = _.round(close);
        const coin = symbol === "BTCUSDT" ? "BTC" : "ETH";
        // console.log({currentPrice, coin,symbol})
        main({currentPrice, coin, symbol});
    })


    wsClient.subscribeSpotKline("BTCUSDT", '1s');
}

