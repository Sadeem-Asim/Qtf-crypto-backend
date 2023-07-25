import {calculatePercentage, calculateWinrate, round3Precision} from "#utils/common/calculations";

export default function getWinrate(bots) {
    const {profit, loss, break_even, investment} = calculateWinrate(bots);

    return {
        series: [round3Precision(profit), Math.abs(round3Precision(loss)), round3Precision(break_even)], // Profit _ Loss _ Break-down respectively
        profit: calculatePercentage(profit, investment),
        loss: Math.abs(calculatePercentage(loss, investment)),
        breakEvent: calculatePercentage(break_even, investment),
    }
}