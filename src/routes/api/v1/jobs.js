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

// router.get('/fetch', validateToken, async (req, res) => {
//     const mysql_table = "jobs";

//     try {
//         const items = await getItems();

//         for (const item of items) {
//             const [rows_1] = await db.query(`select id from ${mysql_table} where auto_id = ?`, [item.AUTOID]);  
//             if(rows_1.length > 0) continue;

//             const insert_values =
//             {
//                 ecommerce: item.ECOMMERCE,
//                 order_id: item.PEDIDO,
//                 auto_id: item.AUTOID,
//                 aton_sku: item.COD_INTERNO
//             }

//             const sql = buildMySqlInsert(mysql_table, insert_values);

//             await db.query(sql, Object.values(insert_values));
//         }
        
//     } catch (error) {
//         return apiServerError(req, res, error);
//     }

//     let data = [];
//     try {
//         const [rows_1] = await db.query(
//             `select 
//                 products.sku,
//                 jobs.* 
//             from jobs
//             left join products on products.id = jobs.product_id
//             where jobs.status_id = 1;
//             `
//         );  

//         data = rows_1;
        
//     } catch (error) {
//         return apiServerError(req, res, error);
//     }

//     res.status(200).json(
//         {
//             method: req.method,
//             error: false,
//             code: 200,
//             message: "Success",
//             data: data,
//         }
//     );
// });

router.get('/', validateToken, async (req, res) => {
    const mysql_table = "jobs";

    let filter_query = "";
    let filter = {} 

    filter.printer_id = {
        field: `${mysql_table}.printer_id`,
        is_true: `= ${req.query.printer_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.status_id = {
        field: `${mysql_table}.status_id`,
        is_true: req.query.status_id.includes(",") ? `in (${req.query.status_id})` : `= ${req.query.status_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter_query = buildMySqlFilter(req.query, filter);

    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select 
            jobs.*,
            job_status.label as job_status,
            products.sku,
            products.print_time,
            products.weight_gross,
            products.weight_net,
            products.quantity
        from jobs
        join products on products.id = jobs.product_id
        join job_status on job_status.id = jobs.status_id
        ${filter_query}
        `
        );  
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

router.get('/:id', validateToken, async (req, res) => {
    const mysql_table = "jobs";
    const id = req.params.id;

    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select 
            jobs.*,
            job_status.label as job_status,
            products.sku,
            products.print_time,
            products.weight_gross,
            products.weight_net,
            products.quantity
        from jobs
        join products on products.id = jobs.product_id
        join job_status on job_status.id = jobs.status_id
        where jobs.id = ?
        `, [id]
        );  
        data = rows_1[0];
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

const postJobsValidation = require("../../../validation/v1/jobs/v1_post_jobs"); 
router.post('/', validateToken, checkSchema(postJobsValidation), async (req, res) => {
    const mysql_table = "jobs";

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
                        {
                id: req.body.product_id,
                table: "products",
                field: "body 'product_id'"
            }
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {    
        await db.query(sql, Object.values(req.body));
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
            message: "Job created successfully",
            data: data,
        }
    );
});


module.exports = router;