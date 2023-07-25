import _ from "lodash";

const extractApiKeys = (api, type = 'binance') => {
    const apiKeys = {apiKey: ''};

    if (api) {
        if (type === 'binance') {
            apiKeys['apiKey'] = _.get(api, 'binance.apiKey', '');
            apiKeys['secret'] = _.get(api, 'binance.secret', '');
        }
        else if(type === 'kucoinApi') {
            apiKeys['apiKey'] = _.get(api, 'ku_coin.apiKey', '');
            apiKeys['secret'] = _.get(api, 'ku_coin.secret', '');
            apiKeys['passphrase'] = _.get(api, 'ku_coin.passphrase', '');
        }
        else {
            apiKeys['apiKey'] = _.get(api, 'ku_coin.apiKey', '');
            apiKeys['secretKey'] = _.get(api, 'ku_coin.secret', '');
            apiKeys['passphrase'] = _.get(api, 'ku_coin.passphrase', '');
            apiKeys['environment'] = 'live'
        }
        return apiKeys;
    } else
        return apiKeys;

};

export default extractApiKeys