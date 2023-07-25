import _ from "lodash";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { getEnv } from "#utils/common/env";
import getCoinStats from "#utils/binance/getCoinStats";
import { JWT_ERRORS, SOCKET_EVENTS, USER_ROLES } from "#constants/index";
import binanceSDKInstance from "#utils/binance/binanceSDKInstance";
import getBinanceCoinPrice from "#utils/binance/getBinanceCoinPrice";
import getBinanceAccountBalance from "#utils/binance/getBinanceAccountBalance";

class SocketServer {
  constructor(server, config = {}) {
    const io = new Server(server, config);

    // Socket Middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake?.auth?.token || "";
        const user = jwt.verify(token, getEnv("JWT_SECRET"));

        // console.log('::::::::   ROLE :::::::::', user.role);

        if ([USER_ROLES[0], USER_ROLES[2]].includes(user.role)) {
          // Admin - SubAmin
          const privateKeys = {
            binance: {
              apiKey: getEnv("ADMIN_BINANCE_API_KEY"),
              secret: getEnv("ADMIN_BINANCE_API_SECRET"),
            },
          };

          socket.handshake.query.api = JSON.stringify(privateKeys);
        }

        //Invalid token condition
        if (!user) next(new Error("invalid token"));

        socket.data.user = user;
        next();
      } catch (e) {
        next(new Error("Unauthorized user"));
      }
    });

    this.socket = io.of("/").on("connection", async (socket) => {
      const userId = _.get(socket, "data.user._id", "");
      const api = _.get(
        socket,
        "handshake.query.api",
        '{"binance":{"apiKey":"","secret":""}}'
      );

      /*Binance*/
      const receiveBinanceEvent = `${SOCKET_EVENTS.hit_binance_api}_${userId}`;
      const sendBinanceDataEvent = `${SOCKET_EVENTS.send_binance_api_data}_${userId}`;

      /*Kucoin*/

      console.log(`SOCKET ID: ${socket.id} Connected`);

      const { binance: binanceApiKeys } = [undefined].includes(
        socket?.handshake?.query?.api
      )
        ? {
            binance: { apiKey: "", secret: "" },
            ku_coin: { apiKey: "", secret: "", passphrase: "" },
          } // default
        : JSON.parse(api); // apis from socket client

      const isBinanceKeysValid = (binanceApiKeys) => {
        if (_.isEmpty(binanceApiKeys)) {
          return false;
        } else
          return (
            binanceApiKeys["apiKey"] !== "" && binanceApiKeys["secret"] !== ""
          );
      };

      if (isBinanceKeysValid(binanceApiKeys)) {
        const { apiKey, secret } = binanceApiKeys;
        /*****************  Binance Socket Events  *****************/
        socket.on(receiveBinanceEvent, async () => {
          const binance = binanceSDKInstance(binanceApiKeys);
          const accountBalance = await getBinanceAccountBalance(
            undefined,
            binanceApiKeys
          );
          const [btc, eth] = await Promise.all([
            getCoinStats("BTCUSDT", binance),
            getCoinStats("ETHUSDT", binance),
          ]);
          const [btcPrice, ethPrice] = await Promise.all([
            getBinanceCoinPrice("BTCUSDT", binance),
            getBinanceCoinPrice("ETHUSDT", binance),
          ]);

          try {
            const data = {
              BTC: {
                ...btc,
                id: "bitcoin",
                name: "Bitcoin",
                symbol: "btc",
                price: btcPrice,
              },
              ETH: {
                ...eth,
                id: "ethereum",
                name: "Ethereum",
                symbol: "eth",
                price: ethPrice,
              },
              balance: accountBalance,
            };

            this.socket.emit(sendBinanceDataEvent, data);
          } catch (e) {
            if (e.message === JWT_ERRORS.expired)
              throw new Error("Jwt Token is Expired");

            console.log("ERROR: ", e);
            this.socket.emit(sendBinanceDataEvent, []);
          }
        });
      }

      socket.on("disconnect", () => {
        console.log(`SOCKET ID: ${socket.id} Disconnected`);
      });
    });
  }
}

export default SocketServer;
