import express from "express";
import {createTransaction, getAllTransaction, getUserTransactions} from "#controllers/transaction.controller";
import authMiddleware from "#middlewares/auth.middleware";


const transactionRoutes = express.Router();

transactionRoutes.route('/')
    .post([authMiddleware], createTransaction)
    .get([authMiddleware], getAllTransaction);

transactionRoutes.get('/:id', [authMiddleware], getUserTransactions)


export default transactionRoutes