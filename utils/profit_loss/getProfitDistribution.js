import {calculatePercentage, calculateProfitDistribution, round3Precision} from "#utils/common/calculations";

export default function getProfitDistribution(bots, currency = undefined) {
    const profitDistribution = calculateProfitDistribution(bots);
    const profitDistributionData = [];

    if (currency) {
        profitDistributionData.push({
            x: currency,
            y: [0, profitDistribution[currency]]
        })
    } else {
        profitDistributionData.push({
            x: 'BTC',
            y: [0, profitDistribution['BTC']]
        });
        profitDistributionData.push({
            x: 'ETH',
            y: [0, profitDistribution['ETH']]
        });
    }

    const assetAllocationData = {
        series: [round3Precision(profitDistribution['ETH']), round3Precision(profitDistribution['BTC'])], // ETH - BTC
        eth: calculatePercentage(profitDistribution['ETH'], profitDistribution['investment']),
        btc: calculatePercentage(profitDistribution['BTC'], profitDistribution['investment']),
    }

    return {profitDistributionData, assetAllocationData};
};