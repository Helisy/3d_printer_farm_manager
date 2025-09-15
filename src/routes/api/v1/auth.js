require('dotenv').config();

const bcrypt = require('bcrypt');
const { sign } = require('jsonwebtoken');

const express = require('express');
const router = express.Router();

const database = require('../../../database');
const db = database();

const { isAuthenticated } = require('../../../middleware/authMiddleware');
const { apiClientError, apiServerError } = require('../../../utils/api_error_handler');
const { checkSchema, validationResult, param, query, matchedData } = require('express-validator');
const { validateObject } = require('../../../utils/functions');

router.get('/logout', async (req, res) => {
    res.cookie('accesstoken', '', {maxAge: 1, httpOnly: true});
    res.json({redirect: "/auth/login"});
});

const postUserRegisterValidation = require("../../../validation/v1/users/v1_post_user_register"); 
router.post('/register', checkSchema(postUserRegisterValidation), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            method: req.method,
            error: true,
            code: 400,
            message: "Incorrect entry.",
            data: result.array()
        })
    }

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    const {first_name, last_name, username, password} = req.body;

    let users_data = [];
    try {
        const [rows_1] = await db.query(`SELECT * FROM users WHERE username = ? or (first_name = ? and last_name = ?) and deleted_at is null`, [username, first_name, last_name]);  
        users_data = rows_1;
    } catch (error) {
        return apiServerError(req, res, error);
    }

    if(users_data.length > 0){
        return apiClientError(req, res, [], `Esse usuário ja existe`, 400)
    }

    let hash;
    try {
        hash = await bcrypt.hash(password, 10);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    try {
        await db.query(`
            INSERT INTO users 
            (
                first_name, 
                last_name, 
                username, 
                password
            ) VALUES(?, ?, ?, ?)`,
            [first_name, last_name, username, hash]);  

    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(201).json(
        {
            method: req.method,
            error: false,
            code: 201,
            message: "Usuário criado com sucesso!",
            data: [],
        }
    );
});

const postUserLoginValidation = require("../../../validation/v1/users/v1_post_user_login"); 
router.post('/login', checkSchema(postUserLoginValidation), async (req, res) => {

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({
            method: req.method,
            error: true,
            code: 400,
            message: "Incorrect entry.",
            data: result.array()
        })
    }

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    const {username, password} = req.body;

    let user_data = [];
    try {
        const [rows_1] = await db.query(`SELECT * FROM users WHERE username = ? and deleted_at is null`, [username]);  
        user_data = rows_1;
    } catch (error) {
        return apiServerError(req, res, error);
    }

    if(user_data.length < 1){
        return apiClientError(req, res, [], `Usuário não encontrado.`, 400)
    }
    user_data = user_data[0];

    let match;
    try {
       match = await bcrypt.compare(password, user_data['password']);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    if(!match){
        return apiClientError(req, res, [], `Senha incorreta.`, 400)
    }else{
        const accessToken = sign({
            firstName: user_data.first_name, 
            lastName: user_data.last_name,
            userId: user_data.id,
            role: user_data.role
        }, process.env.TOKEN_SECRETE);

        return res.cookie('accesstoken', accessToken, {maxAge: 12 * 60 * 60 * 1000, httpOnly: true})
        .status(200).json(
            {
                method: req.method,
                error: false,
                code: 201,
                message: "Login realizado com sucesso!",
                data: [],
            }
        );
    }
});

module.exports = router;