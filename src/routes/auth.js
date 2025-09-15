require('dotenv').config();

const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');

const express = require('express');
const router = express.Router();

const database = require('../database');
const db = database();

const { isAuthenticated } = require('../middleware/authMiddleware');
const { response } = require('express');


//Redirects to /auth/login
router.get('/', isAuthenticated, (req, res) => {
    res.redirect('auth/login');
});

router.get('/login', isAuthenticated, (req, res) => {
    res.render('auth/login.ejs')
});

//Logs out the user
router.get('/logout', async (req, res) => {
    res.cookie('acessToken', '', {maxAge: 1, httpOnly: true});
    res.redirect('/auth/login');
});

module.exports = router;