import {createHmac} from "crypto";
import convertToQueryParams from "#utils/common/convertToQueryParams";
import getTimestamp from "#utils/common/getTimestamp";

const getBinanceParams = (params = {timestamp: getTimestamp(), recvWindow: 60000}, secret = '') => {
    //Add timestamp param if not present in params;
    if (!params.hasOwnProperty('timestamp'))
        params.timestamp = getTimestamp();

    //Add recvWindow param if not present in params;
    if (!params.hasOwnProperty('recvWindow'))
        params.recvWindow = 60000;

    // Object to query string
    const queryString = convertToQueryParams(params)

    const signature = createHmac("sha256", secret)
        .update(queryString)
        .digest("hex");

    return `${queryString}&signature=${signature}`
};


export default getBinanceParams