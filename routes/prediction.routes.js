import express from "express";
import {getPrediction, savePrediction} from "#controllers/prediction.controller";
import authMiddleware from "#middlewares/auth.middleware";


const predictionRoutes = express.Router();


predictionRoutes
    .route('/')
    .post([authMiddleware],savePrediction)
    .get([authMiddleware],getPrediction)

export default predictionRoutes;