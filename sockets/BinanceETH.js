import _ from "lodash";

import {DefaultLogger, WebsocketClient} from "binance";
import main from "#sockets/Binance/main";

export default function BinanceETH() {
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

        main({currentPrice, coin, symbol});
    })


    wsClient.subscribeSpotKline("ETHUSDT", '1s');
}