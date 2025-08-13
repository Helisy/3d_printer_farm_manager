const express = require('express');
const router = express.Router();

const database = require('../../../database');
const db = database();

const { buildMySqlFilter, buildMySqlInsert, checkExistence, msySqlUpdateConstructor } = require('../../../utils/sql_contructors');
const { apiClientError, apiServerError } = require('../../../utils/api_error_handler');
const { checkSchema, validationResult, param, query, matchedData } = require('express-validator');
const { validateObject, areAllItemsInArray } = require('../../../utils/functions');
const { validateToken, checkRole } = require('../../../middleware/authMiddleware');

router.get('/', validateToken, async (req, res) => {
    const mysql_table = "printers";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query}`);  
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

router.get('/:id', param('id').isInt(), validateToken, async (req, res) => {
    const mysql_table = "printers";
    const user_role = req.user.role;

    const id = req.params.id;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query == "" ? `where id = ${id}` : filter_query + ` and id = ${id}`}`);  
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

const postPrinters = require("../../../validation/v1/printers/v1_post_printers"); 
router.post('/', validateToken, checkSchema(postPrinters), async (req, res) => {
    const mysql_table = "printers";

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
                id: req.body.printer_brand_id,
                table: "printer_brands",
                field: "body 'printer_brands'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        // const [rows] = await db.query(`select * from ${mysql_table} where label = ?`, [req.body.label]);

        // if(rows.length > 0){
        //     return apiClientError(req, res, [], `Está marca ja foi adicionada`, 400)
        // }
    
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
            message: "Printer created successfully",
            data: data,
        }
    );
});

const putPrintersValidation = require("../../../validation/v1/printers/v1_put_printers"); 
router.put('/:id', param('id').isInt(), validateToken, checkSchema(putPrintersValidation), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "printers";

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
                id: req.body.printer_brand_id,
                table: "printer_brands",
                field: "body 'printer_brands'"
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
        let [rows_1] = await db.execute(`select * from ${mysql_table} where id = ${id};`);
        data = rows_1;
    } catch (error) {
        return apiServerError(req, res, error)
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Printer updated successfully",
            data: data,
        }
    );
});

router.delete('/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "printers";

    try {
        await checkExistence([
            {
                id: id,
                table: "printers",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }
    
    try {
        const [rows_1] = await db.query(`select * from connection_lib where printer_id = ?`, [id]);  

        await db.query(`update ${mysql_table} set deleted_at = now() where id = ?`, [id]);
        await db.query(`update connection_lib set deleted_at = now() where printer_id = ?`, [id]);
       
        if(rows_1.length > 0){
            await db.query(`update connection_values set deleted_at = now() where connection_lib_id = ?`, [rows_1[0].id]);
        }
    } catch (error) {
        console.log(error)
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Printer deleted successfully",
            data: [],
        }
    );
});

router.get('/brands', validateToken, async (req, res) => {
    const mysql_table = "printer_brands";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";


    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query}`);  
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

router.get('/connections', validateToken, async (req, res) => {
    const mysql_table = "connection_lib";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";



    filter.printer_id = {
        field: `${mysql_table}.printer_id`,
        is_true: `= ${req.query.printer_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.show_deleted = {
        field: `deleted_at`,
        is_true: user_role == "admin" ? "": "is null",
        is_false: "is null",
        validate_by_value: true,
        value: "true"
    }

    filter_query = buildMySqlFilter(req.query, filter);

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query}`);  
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

const postConnections = require("../../../validation/v1/printers/v1_post_connections"); 
router.post('/connections', validateToken, checkSchema(postConnections), async (req, res) => {
    const mysql_table = "connection_lib";

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
                field: "body 'printers'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        const [rows] = await db.query(`select * from ${mysql_table} where printer_id = ? and deleted_at is null`, [req.body.printer_id]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Já existe uma conexão criada`, 400)
        }
    
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
            message: "Connection created successfully",
            data: data,
        }
    );
});

router.delete('/connections/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "connection_lib";

    try {
        await checkExistence([
            {
                id: id,
                table: "connection_lib",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        await db.query(`update ${mysql_table} set deleted_at = now() where id = ?`, [id]);
        await db.query(`update connection_values set deleted_at = now() where connection_lib_id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Printer deleted successfully",
            data: [],
        }
    );
});

router.get('/connections/:id/values', param('id').isInt(), validateToken, async (req, res) => {
    const connection_lib_id = req.params.id;
    const mysql_table = "connection_values";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query + " and connection_lib_id = " + connection_lib_id}`);  
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

const postConnectionsValues = require("../../../validation/v1/printers/v1_post_connections_values"); 
router.post('/connections/:id/values', param('id').isInt(), validateToken, checkSchema(postConnectionsValues), async (req, res) => {
    const connection_lib_id = req.params.id;
    const mysql_table = "connection_values";

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
                id: connection_lib_id,
                table: "connection_lib",
                field: "query 'connection_lib_id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        const [con_types] = await db.query(
        `
        select 
            connection_types.id,
            connection_types.value
        from connection_lib 
        join printers on printer_id = printers.id
        join connection_types on printers.printer_brand_id = connection_types.printer_brand_id
        where connection_lib.id = ?;
        `, [connection_lib_id]);

        const arrayA = con_types.map(e => { return e.id })
        const arrayB = req.body.values.map(e => { return e.value_id })

        if(!areAllItemsInArray(arrayA, arrayB)){
            return apiClientError(req, res, [], "Valores incorretos de conexão para a marca da impressora", 400)
        }

    } catch (error) {
        return apiServerError(req, res, error);
    }

    const valid_values = req.body.values.map(value => {
        return {
            connection_lib_id: parseInt(connection_lib_id),
            connection_type_id: value.value_id,
            value: value.value
        }
    });

    const sql = valid_values.map(value => {
        return {
            query: buildMySqlInsert(mysql_table, value),
            values: value
        }
    });

    let data = [];
    try {
        const [rows] = await db.query(`select * from ${mysql_table} where connection_lib_id = ?`, [connection_lib_id]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Já existe valores de conexão criados`, 400)
        }

        for (const query_data of sql) {
             await db.query(query_data.query, Object.values(query_data.values));
        }
       
        const [rows_1] = await db.query(`select * from ${mysql_table} where connection_lib_id = ?`, [connection_lib_id]);  
        data = rows_1[0];
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(201).json(
        {
            method: req.method,
            error: false,
            code: 201,
            message: "Connection created successfully",
            data: data,
        }
    );
});

const putConnectionsValues = require("../../../validation/v1/printers/v1_put_connections_values"); 
router.put('/connections/:id/values/:value_id', param('id').isInt(), param('value_id').isInt(), validateToken, checkSchema(putConnectionsValues), async (req, res) => {
    const connection_lib_id = req.params.id;
    const value_id = req.params.value_id;
    const mysql_table = "connection_values";

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
                id: connection_lib_id,
                table: "connection_lib",
                field: "param 'id'"
            },
            {
                id: value_id,
                table: "connection_values",
                field: "param 'value_id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    let data = [];

    const validationData = matchedData(req, { locations: ['body'], includeOptionals: true });
    validateObject(req.body, validationData);

    const sqlUpdate = msySqlUpdateConstructor(mysql_table, value_id, req.body);

    try {
        await db.execute(sqlUpdate.sql, sqlUpdate.values);
        let [rows_1] = await db.execute(`select * from ${mysql_table} where id = ${value_id};`);
        data = rows_1;
    } catch (error) {
        return apiServerError(req, res, error)
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Connection value updated successfully",
            data: data,
        }
    );
});

router.get('/connections/types', validateToken, async (req, res) => {
    const mysql_table = "connection_types";

    let filter_query = "";

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table}`);  
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

router.get('/filaments/brands', validateToken, async (req, res) => {
    const mysql_table = "filament_brands";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query}`);  
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

const postPrintersFilamentsBrandsValidation = require("../../../validation/v1/printers/v1_post_printers_filaments_brands"); 
router.post('/filaments/brands', validateToken, checkSchema(postPrintersFilamentsBrandsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "filament_brands";

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

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {

        const [rows] = await db.query(`select * from ${mysql_table} where label = ?`, [req.body.label]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Está marca ja foi adicionada`, 400)
        }
    
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
            message: "Printer brand created successfully",
            data: data,
        }
    );
});

router.delete('/filaments/brands/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "filament_brands";

    try {
        await checkExistence([
            {
                id: id,
                table: "filament_brands",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        const [rows_1] = await db.query(`select * from filaments where filament_brand_id = ? and deleted_at is null`, [id]);

        if(rows_1.length > 0){
            return apiClientError(req, res, [], `Esta marca não pode ser deletado, pois está sendo utilizado por um filamento.`, 403)
        }

        await db.query(`update ${mysql_table} set deleted_at = now() where id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Filament brand deleted successfully",
            data: [],
        }
    );
});

router.get('/filaments/materials', validateToken, async (req, res) => {
    const mysql_table = "materials";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }

    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select 
            *
        from materials
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

const postPrintersFilamentsMaterialsValidation = require("../../../validation/v1/printers/v1_post_printers_filaments_materials"); 
router.post('/filaments/materials', validateToken, checkSchema(postPrintersFilamentsMaterialsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "materials";

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

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        const [rows] = await db.query(`select * from ${mysql_table} where label = ?`, [req.body.value]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Este material ja foi adicionado`, 400)
        }
    
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
            message: "Material created successfully",
            data: data,
        }
    );
});

router.delete('/filaments/materials/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "materials";

    try {
        await checkExistence([
            {
                id: id,
                table: "materials",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        const [rows_1] = await db.query(`select * from filaments where material_id = ? and deleted_at is null`, [id]);

        if(rows_1.length > 0){
            return apiClientError(req, res, [], `Este material não pode ser deletado, pois está sendo utilizado por um filamento.`, 403)
        }

        await db.query(`update ${mysql_table} set deleted_at = now() where id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Material deleted successfully",
            data: [],
        }
    );
});

router.get('/filaments', validateToken, async (req, res) => {
    const mysql_table = "filaments";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where deleted_at is null"
    }
    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select 
            filaments.* ,
            filament_brands.label as filament_brand_name,
            materials.label as material
        from filaments
        join filament_brands on filament_brands.id = filament_brand_id
        join materials on materials.id = material_id
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

const postPrintersFilamentsValidation = require("../../../validation/v1/printers/v1_post_printers_filaments"); 
router.post('/filaments', validateToken, checkSchema(postPrintersFilamentsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "filaments";

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
                id: req.body.filament_brand_id,
                table: "filament_brands",
                field: "body 'filament_brand_id'"
            },
            {
                id: req.body.material_id,
                table: "materials",
                field: "body 'material_id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        const [rows] = await db.query(`select * from ${mysql_table} where filament_brand_id = ? and material_id = ? and color = ? and deleted_at is null`, [req.body.filament_brand_id, req.body.material_id, req.body.color]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Este filamento ja foi adicionada`, 400)
        }
    
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
            message: "Filament created successfully",
            data: data,
        }
    );
});

router.delete('/filaments/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "filaments";

    try {
        await checkExistence([
            {
                id: id,
                table: "filaments",
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
            message: "Filament deleted successfully",
            data: [],
        }
    );
});

router.get('/filaments/current', validateToken, async (req, res) => {
    const mysql_table = "current_filaments";

    let filter_query = "";
    let filter = {} 

    filter.show_all = {
        field: `${mysql_table}.in_use`,
        is_true: "",
        is_false: "= true",
        validate_by_value: true,
        value: "true"
    }

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

const postPrintersFilamentsCurrentValidation = require("../../../validation/v1/printers/v1_post_printers_filaments_current"); 
router.post('/filaments/current', validateToken, checkSchema(postPrintersFilamentsCurrentValidation), async (req, res) => {
    const mysql_table = "current_filaments";

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
                id: req.body.filament_id,
                table: "filaments",
                field: "body 'filament_id'"
            }
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        await db.query(`update ${mysql_table} set in_use = false where in_use = true and printer_id = ?;`, [req.body.printer_id]);
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
            message: "Filament created successfully",
            data: data,
        }
    );
});

const putPrintersFilamentsCurrentValidation = require("../../../validation/v1/printers/v1_put_printers_filaments_current"); 
router.put('/filaments/current/:id', param('id').isInt(), validateToken, checkSchema(putPrintersFilamentsCurrentValidation), async (req, res) => {
    const id = req.params.id;
    const mysql_table = "current_filaments";

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
                table: "current_filaments",
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
        
        let [rows_1] = await db.execute(`select * from ${mysql_table} where id = ${id};`);

        if(rows_1[0].in_use == 0){
            return apiClientError(req, res, [], "Não é permitido modificar um filamento já usado.", 400)
        }

        console.log()

        if(req.body.current_quantity > rows_1[0].current_quantity){
            return apiClientError(req, res, [], "O valor inserido é maior do que o ultimo valor registrado.", 400)
        }

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
            message: "Current filament value updated successfully",
            data: data,
        }
    );
});

module.exports = router;