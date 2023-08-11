/*****  Packages  *****/
import cors from "cors";
import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
/*****  Modules  *****/
import logger, { myLogger } from "#utils/logger";
import routes from "#routes/index";
import { envConfig } from "#utils/common/env";
import connectDB from "#config/db.config";
import SocketServer from "#sockets/SocketServer";
import binanceBtcSockets from "#sockets/binanceBtcLib";
import binanceEthSockets from "#sockets/binanceEthLib";

import CoinStats from "#sockets/CoinStats";
import { SOCKET_ORIGINS } from "#constants/index";

envConfig();
connectDB();
logger();

const app = express();
binanceBtcSockets();
// binanceEthSockets();
CoinStats();
const PORT = process.env.PORT || 5000;

/*****  Middlewares  *****/
app.use(cors({ origin: true, credentials: true }));

app.use(cookieParser());
app.use(express.json());

const server = createServer(app);
const sockets = new SocketServer(server, {
  cors: SOCKET_ORIGINS,
  transports: ["websocket", "polling"],
});

routes(app);

export { sockets };

server.listen(PORT, () => console.log(`Server is Listening on port ${PORT}.`));
