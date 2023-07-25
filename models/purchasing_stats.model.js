import mongoose from "mongoose";

import {INDICATORS, RISKS} from "#constants/index";

const purchasingStats = new mongoose.Schema({
    bot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bot',
        required: true
    },
    setting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bot_setting',
        required: true,
    },
    indicator: {
        type: String,
        enum: INDICATORS,
        required: true,
    },
    risk: {
        type: String,
        enum: RISKS,
        required: true
    },
    buy: String,
    sell: String
}, {timestamps: true});

const PurchaseStats = mongoose.model('purchase_stats', purchasingStats);

export {PurchaseStats};