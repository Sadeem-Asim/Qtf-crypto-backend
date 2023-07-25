import {calculateBills, calculatePercentage, round3Precision} from "#utils/common/calculations";

export default async function getBills(user_id) {
    const bills = await calculateBills(user_id);

    const billsData = {
        series: [round3Precision(bills['paidBotsNo']), round3Precision(bills['unpaidBotsNo'])], // Paid - unPaid
        paid: calculatePercentage(bills['paidBotsNo'], bills['total']),
        unPaid: calculatePercentage(bills['unpaidBotsNo'], bills['total']),
    }

    return {
        billsData,
        amountPaid: bills.amountPaid,
        amountUnpaid: bills.amountUnpaid
    };
}