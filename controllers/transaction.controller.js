import asyncHandlerMiddleware from "#middlewares/asyncHandler.middleware";
import {Transaction, validate} from "#models/transactions.model";
import _ from "lodash";

/**
 @desc     Create a new transaction
 @route    POST /api/transaction
 @access   Private
 */
const createTransaction = asyncHandlerMiddleware(async (req, res) => {
    const {error} = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const _transaction = await Transaction.find({bot: req.body.bot})

    req.body.total = _transaction.length > 0
        ? _transaction.reduce((total, record) => {
            if (record.side === 'BUY')
                total += record.price;
            if (record.side === 'SELL')
                total -= record.price;
            return total;
        }, 0) : 0;
    const transaction = await new Transaction(
        _.pick(
            req.body,
            [
                'qty',
                'type',
                'side',
                'price',
                'status',
                'symbol',
                'tradeId',
                'orderId',
                'timeInForce',
                'transactTime',
                'clientOrderId',
                'user',
                'bot',
                'total'
            ]
        )).save();

    if (!transaction) {
        return res.status(400).send('Some Error Has occurred')
    }

    res.status(200).send(transaction)
});

/**
 @desc     get user transactions
 @route    GET /api/transaction/:id
 @access   Private
 */
const getUserTransactions = asyncHandlerMiddleware(async (req, res) => {
    const id = req.params.id;
    const transactions = await Transaction.find({user: id});
    res.status(200).send(transactions)
})

/**
 @desc     get all transactions
 @route    GET /api/transaction
 @access   Private
 */

const getAllTransaction = asyncHandlerMiddleware(async (req, res) => {
    const transactions = await Transaction.find();
    res.status(200).send(transactions);
})

export {createTransaction, getUserTransactions, getAllTransaction}