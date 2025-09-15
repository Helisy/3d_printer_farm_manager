const express = require('express');
const router = express.Router();

const axios = require('axios');
const fs = require('fs');
const fsp = require('fs').promises;
const FormData = require('form-data');
const path = require('path');

const database = require('../../../database');
const db = database();

const { inserZOffset } = require("../../../utils/edit_gcode")

const { buildMySqlFilter, buildMySqlInsert, checkExistence, msySqlUpdateConstructor } = require('../../../utils/sql_contructors');
const { apiClientError, apiServerError } = require('../../../utils/api_error_handler');
const { checkSchema, validationResult, param, query, matchedData } = require('express-validator');
const { validateObject, areAllItemsInArray } = require('../../../utils/functions');
const { validateToken, checkRole } = require('../../../middleware/authMiddleware');



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
        join printers on printers.id = connection_lib.printer_id
        join printer_models on printer_models.id = printers.printer_model_id
        join connection_types on printer_models.printer_brand_id = connection_types.printer_brand_id
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

    let filter = {} 
    let filter_query = "";


   filter.printer_brand_id = {
        field: `${mysql_table}.printer_brand_id`,
        is_true: `= ${req.query.printer_brand_id}`,
        is_false: "",
        validate_by_value: false,
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
            field: `filaments.deleted_at`,
            is_true: "",
            is_false: "is null",
            validate_by_value: true,
            value: "true"
        }

        filter_query = buildMySqlFilter(req.query, filter);
    }else{
        filter_query = "where filaments.deleted_at is null"
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

        for (const row of rows_1) {
            cur_row = row;

            const [rows_2] = await db.query(
                `
                select 
                    filaments.*,
                    filament_brands.label as filament_brands_name,
                    materials.label as material_name
                from filaments 
                join filament_brands on filament_brands.id = filaments.filament_brand_id
                join materials on materials.id = filaments.material_id
                where filaments.id = ?;
                `, [row.filament_id]
            );

            cur_row.filament = rows_2[0];

            data.push(cur_row) 
        }
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











router.get('/models', validateToken, async (req, res) => {
    const mysql_table = "printer_models";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";

    if(user_role == "admin"){
        filter.show_deleted = {
            field: `${mysql_table}.deleted_at`,
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
            printer_models.*,
            printer_brands.label as printer_brand_name
        from printer_models
        join printer_brands on printer_brands.id = printer_models.printer_brand_id
        ${filter_query}
        `);  
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

const postPrinterModelsValidation = require("../../../validation/v1/printers/v1_post_printers_models"); 
router.post('/models', validateToken, checkSchema(postPrinterModelsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "printer_models";

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

router.delete('/models/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "printer_models";

    try {
        await checkExistence([
            {
                id: id,
                table: "printer_models",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        const [rows_1] = await db.query(`select * from printers where printer_model_id = ? and deleted_at is null`, [id]);
        const [rows_2] = await db.query(`select * from products where printer_model_id = ? and deleted_at is null`, [id]);

        if(rows_1.length > 0){
            return apiClientError(req, res, [], `Esta modelo não pode ser deletado, pois está sendo utilizado por uma impressora.`, 403)
        }

        if(rows_2.length > 0){
            return apiClientError(req, res, [], `Esta modelo não pode ser deletado, pois está sendo utilizado por um propduto.`, 403)
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
            message: "Model deleted successfully",
            data: [],
        }
    );
});









router.get('/:id/init', param('id').isInt(), validateToken, async (req, res) => {
    const mysql_table = "printers";

    const id = req.params.id;

    let data = [];

    let printer_ip;
    let g_code;
    let job_id;
    let z_offset;

    const project_root = path.resolve(__filename, '../../../../../');

    try {
        const [rows_1] = await db.query(
        `
        select 
            connection_lib.id as connection_lib_id,
            connection_values.connection_type_id,
            connection_types.value as type,
            connection_values.value
        from connection_lib
        join connection_values on connection_values.connection_lib_id = connection_lib.id
        join connection_types on connection_types.id = connection_values.connection_type_id
        where 
            connection_lib.printer_id = ? and connection_types.value = "IP";
        `
        , [id]);

        printer_ip = rows_1[0].value;

        const [rows_2] = await db.query(
        `
        select 
            jobs.id as job_id,
            files.path
        from jobs 
        join products on products.id = jobs.product_id
        join files on files.id = products.file_id
        where 
            printer_id = ? and
            status_id = 1
        order by jobs.id asc limit 1
        `
        , [id]);

        const [rows_3] = await db.query(`select z_displacement from printers where id = ?;`, [id]);

        g_code = rows_2[0].path;
        job_id = rows_2[0].job_id;
        z_offset = rows_3[0].z_displacement;
        
    } catch (error) {
        return apiServerError(req, res, error);
    }

    const newCode = g_code.split(".")[0] + "_job_" + job_id + ".gcode";

    const input = path.join(project_root, "public", "gcodes_files", g_code);
    const output = path.join(project_root, "public", "temp", newCode);


    await inserZOffset(input, output, z_offset);

    await sleep(500);

    const url = `http://${printer_ip}/upload/${newCode}`;

    const form = new FormData();
    form.append('file', fs.createReadStream(output), {
        filename: newCode,
        contentType: 'application/octet-stream'
    });

    const headers = {
        'Origin': `http://${printer_ip}`,
        'Referer': `http://${printer_ip}/`,
        'User-Agent': 'CrealityUploader/1.0',
        'Accept': 'application/json, text/plain, */*',
        ...form.getHeaders()  // headers do form-data
    };

    try {
        const response = await axios.post(url, form, { headers });

        console.log(`Status: ${response.status}`);
        console.log("Resposta:", response.data);

        if (response.status !== 200) {
            throw new Error(`Upload falhou. Código de status: ${response.status}`);
        }

        data = {
            file: newCode,
            job_id
        };

    } catch (error) {
        console.log(error.code )
        if (error.code === 'ECONNRESET') {
            data = {
                file: newCode,
                job_id
            };
        }else{
            return apiServerError(req, res, error);
        } 
    }

    try {
        await db.query(`update jobs set status_id = 2 where id = ?`, [job_id]);
        await db.query(`update printers set printer_status_id = 2 where id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    await sleep(500);

    await deleteFile(output);

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function deleteFile(file_path) {
    const file = path.resolve(file_path);

    try {
        await fsp.unlink(file);
    } catch (error) {
        console.error(`Erro ao deletar o arquivo: ${error.message}`);
    }
}

router.get('/:id/job_done', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    try {
        await db.query(`update jobs set status_id = 3 where status_id = 2 and printer_id = ?`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Success",
            data: [],
        }
    );
});

router.get('/:id/job_conclude', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    try {
        await db.query(`update jobs set status_id = 4 where status_id = 3 and printer_id = ?`, [id]);
        await db.query(`update printers set printer_status_id = 1 where id = ?;`, [id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Success",
            data: [],
        }
    );
});

router.get('/:id/current_job', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    let data = []
    try {
        const [rows] = await db.query(`select * from jobs where printer_id = ? and status_id in (2, 3)`, [id]);
        data = rows;
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

router.get('/:id/reset_job', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    let data = []
    try {
        await db.query(`update jobs set status_id = 1 where printer_id = ? and status_id in (2, 3);`, [id]);
        await db.query(`update printers set printer_status_id = 1 where id = ?;`, [id]);

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

router.get('/:id/reset_printer', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    let data = []
    try {
        await db.query(`update jobs set status_id = 5 where printer_id = ? and status_id in (1, 2, 3);`, [id]);
        await db.query(`update printers set printer_status_id = 1 where id = ?;`, [id]);

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

router.get('/:id/toggle', param('id').isInt(), validateToken, async (req, res) => {
    const id = req.params.id;

    let data = []
    try {
        const [row] = await db.query(`select * from printers where id = ?`, [id]);
        await db.query(`update printers set is_active = ${row[0].is_active == 1 ? 0 : 1} where id = ?;`, [id]);

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






router.get('/', validateToken, async (req, res) => {
    const mysql_table = "printers";
    const user_role = req.user.role;
    
    let filter = {} 
    let filter_query = "";


   filter.printer_status_id = {
        field: `${mysql_table}.printer_status_id`,
        is_true: `= ${req.query.printer_status_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.show_deleted = {
        field: `${mysql_table}.deleted_at`,
        is_true: user_role == "admin" ? "": "is null",
        is_false: "is null",
        validate_by_value: true,
        value: "true"
    }

    filter_query = buildMySqlFilter(req.query, filter);

    let data = [];
    try {
        const [rows_1] = await db.query(
            `
            select printers.*,
            printer_status.label as printer_status,
            printer_models.label as printer_model_label,
            printer_brands.label as printer_brand_label
            from printers
            join printer_status on printer_status.id = printers.printer_status_id
            join printer_models on printer_models.id = printers.printer_model_id
            join printer_brands on printer_brands.id = printer_models.printer_brand_id
            ${filter_query}
            `);  

            for (const row of rows_1) {
                let cur = row;
                let con = {};

                const [rows_2] = await db.query(
                `
                select 
                    connection_lib.id as connection_lib_id,
                    connection_values.connection_type_id,
                    connection_values.id as connection_value_id,
                    connection_types.value as type,
                    connection_values.value
                from connection_lib
                join connection_values on connection_values.connection_lib_id = connection_lib.id
                join connection_types on connection_types.id = connection_values.connection_type_id
                where 
                    connection_lib.printer_id = ?
                `, [cur.id]);

                for (const row2 of rows_2) {
                    con[row2.type] = row2;
                }

                cur.connection = con;

                data.push(cur);
            }

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

    let data = [];
    try {
        const [rows_1] = await db.query(
            `
            select printers.*,
            printer_status.label as printer_status,
            printer_models.label as printer_model_label,
            printer_brands.label as printer_brand_label
            from printers
            join printer_status on printer_status.id = printers.printer_status_id
            join printer_models on printer_models.id = printers.printer_model_id
            join printer_brands on printer_brands.id = printer_models.printer_brand_id
            where printers.id = ${id}
            `);  

            for (const row of rows_1) {
                let cur = row;
                let con = {};

                const [rows_2] = await db.query(
                `
                select 
                    connection_lib.id as connection_lib_id,
                    connection_values.connection_type_id,
                    connection_values.id as connection_value_id,
                    connection_types.value as type,
                    connection_values.value
                from connection_lib
                join connection_values on connection_values.connection_lib_id = connection_lib.id
                join connection_types on connection_types.id = connection_values.connection_type_id
                where 
                    connection_lib.printer_id = ?
                `, [cur.id]);

                for (const row2 of rows_2) {
                    con[row2.type] = row2;
                }

                cur.connection = con;

                data.push(cur);
            }
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
                table: "printer_models",
                field: "body 'printer_models'"
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

module.exports = router;