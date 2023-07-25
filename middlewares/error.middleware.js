const errorMiddleware = (err, req, res, next) => {

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const error = {
        status: false,
        err: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    }

    if (err.isAxiosError)
        error.err = err.response.data

    res.status(statusCode).send(error)
}

const _404_NotFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(400);
    next(error)
};

export default errorMiddleware
export {_404_NotFound}
