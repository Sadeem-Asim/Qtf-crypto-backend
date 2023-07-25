import _ from 'lodash'

const convertToQueryParams = (params = {}) => {
    const keys = _.keys(params);

    return keys.length > 0
        ? keys.map((key) => `${key}=${params[key]}`).join('&')
        : '';
};

export default convertToQueryParams