const express = require('express');
const router = express.Router();

const database = require('../../../database');
const db = database();

const bcrypt = require('bcrypt');

const { buildMySqlFilter, buildMySqlInsert, checkExistence, msySqlUpdateConstructor } = require('../../../utils/sql_contructors');
const { apiClientError, apiServerError } = require('../../../utils/api_error_handler');
const { checkSchema, validationResult, param, query, matchedData } = require('express-validator');
const { validateObject, areAllItemsInArray } = require('../../../utils/functions');
const { validateToken, checkRole } = require('../../../middleware/authMiddleware');


router.get('/current', validateToken, async (req, res) => {
    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Success",
            data: req.user,
        }
    );
});

router.get('/', validateToken, async (req, res) => {
    const mysql_table = "users";

    let data = [];
    try {
        const [rows_1] = await db.query(`select id, first_name, last_name, username, role from ${mysql_table} where deleted_at is null`);  
        data = rows_1;
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Success",
            data: data,
        }
    );
});

const putUsersValues = require("../../../validation/v1/users/v1_put_users"); 
router.put('/:id', param('id').isInt(), validateToken, checkRole("admin"), checkSchema(putUsersValues), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "users";

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

    try {
        await checkExistence([
            {
                id: id,
                table: "users",
                field: "param 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    if(!!req.body.password){
        try {
            req.body.password = await bcrypt.hash(req.body.password, 10);
        } catch (error) {
            return apiServerError(req, res, error);
        }
    }

    const sqlUpdate = msySqlUpdateConstructor(mysql_table, id, req.body);

    try {
        await db.execute(sqlUpdate.sql, sqlUpdate.values);
    } catch (error) {
        return apiServerError(req, res, error)
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "User updated successfully",
            data: [],
        }
    );
});

router.delete('/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "users";

    try {
        await checkExistence([
            {
                id: id,
                table: "users",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        await db.query(`update ${mysql_table} set deleted_at = now() where id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Users deleted successfully",
            data: [],
        }
    );
});


module.exports = router;