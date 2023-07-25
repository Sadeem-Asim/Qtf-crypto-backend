import axios from "axios";
import {BINANCE_API_BASE_URL} from "#constants/index";

const createAxiosInstance = () => {
    const headers = {
        'Content-Type': 'application/json',
        // 'X-MBX-APIKEY': 'OLrdNSkRNtKu0g0wUNXzC93cRnhML01SrTJBKGA6u3yCft8IEJzUMJ7B0ddgP20a'
    }
    const api = axios.create({
        baseURL: `${BINANCE_API_BASE_URL}/api/v3/`,
        headers,
        timeout: 60 * 1000,
    });

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const message = error?.response?.data;
            error.message = message ?? error.message
            /*if(error?.response?.data?.errors)
                error.errors = error?.response?.data?.errors;*/
            return Promise.reject(error)
        });

    const getAllOrders = (params,apiKey = '') => {
        headers['X-MBX-APIKEY'] = apiKey;
        return api.get(`allOrders?${params}`, {headers})
    }
    const exchangeInfo = (params) => api.get(`exchangeInfo?${params}`)
    const priceTickler = (params) => api.get(`ticker/price?${params}`)
    const accountInformation = (params, apiKey = '') => {
        headers['X-MBX-APIKEY'] = apiKey;
        return api.get(`account?${params}`,{headers})
    }
    const createTestOrder = (params) => api.post(`order/test?${params}`)
    const createOrder = (params, apiKey = '') => {
        headers['X-MBX-APIKEY'] = apiKey;
        return api.post(`order?${params}`, undefined,{headers})
    }
    const priceChangeIn24hrStatistics = (params) => api.get(`ticker/24hr?${params}`)

    return {
        createTestOrder,
        exchangeInfo,
        priceTickler,
        priceChangeIn24hrStatistics,
        accountInformation,
        getAllOrders,
        createOrder
    }
};


const binanceApi = createAxiosInstance();

export default binanceApi