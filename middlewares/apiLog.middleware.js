import moment from "moment";

const ApiLogMiddleware = (req, res, next) => {
    console.log(`${req.method}: "${req.originalUrl}" on time: ${moment().format()}`)
    next();
}


export default ApiLogMiddleware
