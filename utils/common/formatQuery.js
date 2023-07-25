import qs from "querystring";

function formatQuery(queryObj) {
    if (JSON.stringify(queryObj).length !== 2) {
        return '?' + qs.stringify(queryObj)
    } else {
        return ''
    }
}

export default formatQuery;