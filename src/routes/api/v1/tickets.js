const express = require('express');
const router = express.Router();

const database = require('../../../database');
const db = database();

const { buildMySqlFilter, buildMySqlInsert, checkExistence, msySqlUpdateConstructor } = require('../../../utils/sql_contructors');
const { apiClientError, apiServerError } = require('../../../utils/api_error_handler');
const { checkSchema, validationResult, param, query, matchedData } = require('express-validator');
const { validateObject, areAllItemsInArray } = require('../../../utils/functions');
const { validateToken, checkRole } = require('../../../middleware/authMiddleware');
const { getItems } = require("../../../utils/atom_db")

router.get('/', validateToken, checkRole("admin"), async (req, res) => {
    const mysql_table = "tickets";

    let filter_query = "";
    let filter = {} 

    filter.printer_id = {
        field: `${mysql_table}.printer_id`,
        is_true: `= ${req.query.printer_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter_query = buildMySqlFilter(req.query, filter);

    let data = [];
    try {
        const [rows_1] = await db.query(
        `
            select 
                *
            from ${mysql_table}
            ${filter_query} order by id desc
            `
            );  
        data = rows_1
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

router.get('/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "tickets";

    let data = [];
    try {
        const [rows_1] = await db.query(
            `
            select 
                *
            from ${mysql_table}
            where id = ${id}
            `
            );  
        data = rows_1[0]
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

const postTicketsValidation = require("../../../validation/v1/tickets/v1_post_tickets"); 
router.post('/', validateToken, checkSchema(postTicketsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "tickets";

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
    
    try {
        await checkExistence([
            {
                id: req.body.printer_id,
                table: "printers",
                field: "body 'printer_id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        const [rows] = await db.query(`select * from tickets where printer_id = ? and is_closed = 0`, [req.body.printer_id]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Feche o ticket aberto para criar outro.`, 400)
        }
    
        await db.query(sql, Object.values(req.body));
        await db.query(`update printers set is_active = 0 where id = ?`, [req.body.printer_id]);
        
        const [rows_1] = await db.query(`SELECT * FROM ${mysql_table} order by id desc limit 1`);  
        data = rows_1[0];
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(201).json(
        {
            method: req.method,
            error: false,
            code: 201,
            message: "Product created successfully",
            data: data,
        }
    );
});

const putTicketsValidation = require("../../../validation/v1/tickets/v1_put_ticket"); 
router.put('/:id', param('id').isInt(), validateToken, checkSchema(putTicketsValidation), checkRole("admin"), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "tickets";

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
                table: "tickets",
                field: "param 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    let data = [];

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    const sqlUpdate = msySqlUpdateConstructor(mysql_table, id, req.body);

    try {
        await db.execute(sqlUpdate.sql, sqlUpdate.values);

        let [rows_2] = await db.execute(`select * from ${mysql_table} where id = ${id};`);
        data = rows_2;

    } catch (error) {
        return apiServerError(req, res, error)
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Ticket updated successfully",
            data: data,
        }
    );
});

router.put('/:id/conclude', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "tickets";

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
                table: "tickets",
                field: "param 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    let data = [];

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    const sqlUpdate = msySqlUpdateConstructor(mysql_table, id, req.body);

    try {
        const [rows_1] = await db.query(`select is_closed from tickets where id = ?`, [id]);  

        if(rows_1[0].is_closed == 1){
            return apiClientError(req, res, [], "Ticket já concluído.", 400)
        }

        await db.query(`update tickets set is_closed = 1, closed_at = now() where id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error)
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Ticket updated successfully",
            data: data,
        }
    );
});

module.exports = router;