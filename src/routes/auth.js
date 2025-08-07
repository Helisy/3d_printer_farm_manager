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

router.get('/register', isAuthenticated, (req, res) => {
    res.render('register.ejs', {message: ""})
});

router.get('/login', isAuthenticated, (req, res) => {
    res.render('login.ejs')
});

//Logs out the user
router.get('/logout', async (req, res) => {
    res.cookie('acessToken', '', {maxAge: 1, httpOnly: true});
    res.redirect('/auth/login');
});

//Register a new user
router.post('/register', (req, res) => {

    const {firstName, lastName, email, password} = req.body;

    let sqlEmail = `SELECT * FROM users WHERE email = '${email}'`;

    db.query(sqlEmail, (error, result) => {
        
        if(!result.length)
        {
            bcrypt.hash(password, 10).then((hash) =>
            {
                let sql = `INSERT INTO users (first_name, last_name, email, password) VALUES('${firstName}', '${lastName}',
                 '${email}', '${hash}');`;
        
                 db.query(sql, (error, result) => {
                    if(error) throw error;
        
                    res.redirect('/auth/login');
                }); 
            });
            return;
        }else{
            res.render('register.ejs', {message: "Email already registed"})
            return;
        }
   });


});

//Logs in the user
router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    let sql = `SELECT * FROM users WHERE email = '${email}'`;

     db.query(sql, (error, result) => {
        if(error) throw error;

        if(!result.length)
        {
            res.json({message: "User doesn't exists."})
            return;
        }else{
            bcrypt.compare(password, result[0]['password']).then((match) =>
            {
                if(!match)
                {
                    res.json({message: "Wrong password."})
                    return;
                }else{
                    const acessToken = sign({
                        firstName: result[0].first_name, 
                        lastName: result[0].last_name,
                        userId: result[0].id  
                    }, process.env.TOKEN_SECRETE);

                    res.cookie('acessToken', acessToken, {httpOnly: true}).json({login:'You logged in'});
                    return;
                }
            });

            return;
        }
    });

  
});

module.exports = router;