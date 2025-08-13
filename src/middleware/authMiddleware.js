require('dotenv').config();

const { verify } = require('jsonwebtoken');
const { apiClientError, apiServerError } = require('../utils/api_error_handler');


//Verifies if the the acessToken in the cookies is valid.
const validateToken = (req, res, next) => {
    const accessToken = req.headers['accesstoken'];

    if(!accessToken) return apiClientError(req, res, [], `Token inválido ou não econtrado.`, 401);

    verify(accessToken, process.env.TOKEN_SECRETE, (err, user) =>{
        if (err) return apiClientError(req, res, [], `Token inválido ou não econtrado.`, 401);
        req.user = user;
        return next();
    });
}

//Verifies is the user is already logged.
const isAuthenticated = (req, res, next) => {
    const accessToken = req.headers['accesstoken'];

    if(!accessToken) return next();

        verify(accessToken, process.env.TOKEN_SECRETE, (err, user) =>{
        if (err) return res.sendStatus(403);
        req.user = user;
        res.redirect('/');
    });
}

function checkRole(requiredRole) {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
        return apiClientError(req, res, [], `Acesso negado.`, 403);
    }

    next();
  };
}

module.exports = { validateToken, isAuthenticated, checkRole };