import express from "express";
import authMiddleware from "#middlewares/auth.middleware";
import {getRSI_IndicatorBasedOnCandles, getRSIIndicator} from "#controllers/taapi.controller";

const taapiRoutes = express.Router();

taapiRoutes.route('/rsi')
    .get([authMiddleware], getRSIIndicator)
    .post([authMiddleware], getRSI_IndicatorBasedOnCandles)


export default taapiRoutes;