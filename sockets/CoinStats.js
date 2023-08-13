import { DefaultLogger, WebsocketClient } from "binance";
import EventEmitter from "events";

export const eventEmitter = new EventEmitter();

export default function CoinStats() {
  const statistics = {
    BTC: { id: "bitcoin", name: "Bitcoin", symbol: "btc" },
    ETH: { id: "ethereum", name: "Ethereum", symbol: "eth" },
  };

  const API_KEY = "xxx";
  const API_SECRET = "yyy";

  const logger = {
    ...DefaultLogger,
    silly: (...params) => {
      // console.log(params)
    },
  };

  const wsClient = new WebsocketClient(
    {
      api_key: API_KEY,
      api_secret: API_SECRET,
      beautify: true,
      // wsUrl: "wss://stream.binance.us:9443",
      weUrl: "wss://ws-api.binance.com:443/ws-api/v3",
      // Disable ping/pong ws heartbeat mechanism (not recommended)
      // disableHeartbeat: true
    },
    logger
  );

  eventEmitter.on("ready", (data) => {});

  // receive raw events
  /*wsClient.on('message', (data) => {
    console.log('raw message received ', JSON.stringify(data, null, 2));
  });*/

  // notification when a connection is opened
  wsClient.on("open", (data) => {
    console.log("connection opened open:", data.wsKey, data.ws.target.url);
  });

  // receive formatted events with beautified keys. Any "known" floats stored in strings as parsed as floats.
  wsClient.on("formattedMessage", (data) => {
    const key = data?.symbol === "BTCUSDT" ? "BTC" : "ETH";
    const isPriceEvent = data?.eventType === "trade";
    // console.log("Hello");
    if (isPriceEvent) {
      statistics[key]["price"] = data["price"];
    } else {
      const { priceChange, close, high, low } = data;
      statistics[key] = {
        ...statistics[key],
        change: priceChange,
        close,
        high,
        low,
      };
    }
    // console.log(statistics);

    eventEmitter.emit("stats", statistics);
    // console.log(statistics);
  });

  // read response to command sent via WS stream (e.g LIST_SUBSCRIPTIONS)
  wsClient.on("reply", (data) => {
    console.log("log reply: ", JSON.stringify(data, null, 2));
  });

  // receive notification when a ws connection is reconnecting automatically
  wsClient.on("reconnecting", (data) => {
    // console.log('ws automatically reconnecting.... ', data?.wsKey);
  });

  // receive notification that a reconnection completed successfully (e.g use REST to check for missing data)
  wsClient.on("reconnected", (data) => {
    console.log("ws has reconnected ", data?.wsKey);
  });

  // Recommended: receive error events (e.g. first reconnection failed)
  wsClient.on("error", (data) => {
    console.log("ws saw error ", data?.wsKey);
  });

  wsClient.subscribeSpotSymbol24hrTicker("BTCUSDT");
  wsClient.subscribeSpotSymbol24hrTicker("ETHUSDT");
  wsClient.subscribeSpotTrades("BTCUSDT");
  wsClient.subscribeSpotTrades("ETHUSDT");
}
