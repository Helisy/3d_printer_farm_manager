require('dotenv').config();

const { verify } = require('jsonwebtoken');


//Verifies if the the acessToken in the cookies is valid.
const validateToken = (req, res, next) => {
    const acessToken = req.cookies.acessToken;

    if(!acessToken) return res.redirect('/auth/login');

    verify(acessToken, process.env.TOKEN_SECRETE, (err, user) =>{
        if (err) return res.sendStatus(403);
        req.user = user;
        return next();
    });
}

//Verifies is the user is already logged.
const isAuthenticated = (req, res, next) => {
    const acessToken = req.cookies.acessToken;

    if(!acessToken) return next();

        verify(acessToken, process.env.TOKEN_SECRETE, (err, user) =>{
        if (err) return res.sendStatus(403);
        req.user = user;
        res.redirect('/');
    });
}

module.exports = { validateToken, isAuthenticated };