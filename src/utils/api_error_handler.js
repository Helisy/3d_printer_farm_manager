function apiServerError(req, res, error){
    res.status(500).json(
        {
            method: req.method,
            error: true,
            code: 500,
            message: "Internal Server Error",
            data: [error],
        }
    );
}

function apiClientError(req, res, error, message, http_status){
    res.status(http_status).json(
        {
            method: req.method,
            error: true,
            code: http_status,
            message: message,
            data: [error],
        }
    );
}


class ValidationError extends Error {
    constructor(message, detail) {
        super(message);

        this.name = "ValidationError";
        this.detail = detail;
    }
}


module.exports = { apiServerError, apiClientError, ValidationError };