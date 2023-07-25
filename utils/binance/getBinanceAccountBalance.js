import _ from 'lodash'

import binanceApi from "#services/binance";
import getBinanceParams from "#utils/binance/getBinanceParams";

const getBinanceAccountBalance = async (symbol = 'USDT', binanceKeys) => {
    try {
        const params = getBinanceParams({},binanceKeys.secret);
        const {data} = await binanceApi.accountInformation(params, binanceKeys.apiKey);

        if (data?.balances?.length > 0) {
            const record = data?.balances.filter(record => record?.asset === symbol)[0] || 0;
            return _.round(record?.free, 4);
        } else {
            return 0;
        }
    } catch (error) {
        const _error = _.get(error, 'response.data.msg', error?.message);
        /*TODO:: Temp turn off*/
        // console.log(`Error in getBinanceAccountBalance`, _error);
        return 0
    }
};

export default getBinanceAccountBalance;