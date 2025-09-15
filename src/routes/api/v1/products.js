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

const upload_gcode = require('../../../upload_gcode');
const upload_image = require('../../../upload_image');


// router.get('/fetch', validateToken, async (req, res) => {
//     const mysql_table = "printers";

//     try {
//         const items = await getItems();
//         console.log(items);
//     } catch (error) {
//         return apiServerError(req, res, error);
//     }

    
//     // let data = [];
//     // try {
//     //     const [rows_1] = await db.query(`select * from ${mysql_table} ${filter_query}`);  
//     //     data = rows_1
//     // } catch (error) {
//     //     return apiServerError(req, res, error);
//     // }

//     res.status(200).json(
//         {
//             method: req.method,
//             error: false,
//             code: 200,
//             message: "Success",
//             data: [],
//         }
//     );
// });


router.get('/', validateToken, async (req, res) => {
    const mysql_table = "products";
    
    let filter_query = "";
    let filter = {} 

    filter.printer_model_id = {
        field: `${mysql_table}.printer_model_id`,
        is_true: `= ${req.query.printer_model_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.filament_brand_id = {
        field: `${mysql_table}.filament_brand_id`,
        is_true: `= ${req.query.filament_brand_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.filament_material_id = {
        field: `${mysql_table}.filament_material_id`,
        is_true: `= ${req.query.filament_material_id}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.quantity = {
        field: `${mysql_table}.quantity`,
        is_true: `= ${req.query.quantity}`,
        is_false: "",
        validate_by_value: false,
    }

    filter.has_file = {
        field: `file_id`,
        is_true: "is not null",
        is_false: "",
        validate_by_value: true,
        value: "true"
    }

    filter.q = {
        field: `${mysql_table}.sku`,
        is_true: `like '${req.query.q}%'`,
        is_false: "",
        validate_by_value: false,
    }

    filter_query = buildMySqlFilter(req.query, filter);

    filter_query = filter_query == "" ? "where products.deleted_at is null" : filter_query + "and products.deleted_at is null";
   
    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select  
            products.*,
            printer_models.label as printer_model_name,
            printer_brands.label as printer_brand_name,
            filament_brands.label as filament_brand_name,
            materials.label as material_name
        from products
        join printer_models on printer_models.id = products.printer_model_id
        join printer_brands on printer_brands.id = printer_models.printer_brand_id
        join filament_brands on filament_brands.id = products.filament_brand_id
        join materials on materials.id = products.filament_material_id
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

router.get('/:id', param('id').isInt(), validateToken, async (req, res) => {
    const mysql_table = "products";
    const user_role = req.user.role;
    const id = req.params.id;
    
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
        filter_query = `where ${mysql_table}.deleted_at is null`;
    }

    let data = [];
    try {
        const [rows_1] = await db.query(
        `
        select  
            products.*,
            printer_models.label as printer_model_name,
            printer_brands.label as printer_brand_name,
            filament_brands.label as filament_brand_name,
            materials.label as material_name
        from products
        join printer_models on printer_models.id = products.printer_model_id
        join printer_brands on printer_brands.id = printer_models.printer_brand_id
        join filament_brands on filament_brands.id = products.filament_brand_id
        join materials on materials.id = products.filament_material_id
        ${filter_query == "" ? `where ${mysql_table}.id = ${id}` : filter_query + ` and ${mysql_table}.id = ${id}`}
        `
        );  
        data = rows_1;
    } catch (error) {
        console.log(error)
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

const postProductsValidation = require("../../../validation/v1/products/v1_post_products"); 
router.post('/', validateToken, checkSchema(postProductsValidation), checkRole("admin"), async (req, res) => {
    const mysql_table = "products";

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
                table: "filament_brands",
                field: "body 'filament_brand_id'"
            },
            {
                id: req.body.filament_brand_id,
                table: "printer_brands",
                field: "body 'filament_brand_id'"
            },
            {
                id: req.body.filament_material_id,
                table: "materials",
                field: "body 'filament_material_id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    req.body.print_time = req.body.print_time + ":00"

    const sql = buildMySqlInsert(mysql_table, req.body);

    let data = [];
    try {
        const [rows] = await db.query(`
            select * from ${mysql_table} 
            where 
                filament_brand_id = ? and 
                filament_material_id = ? and
                printer_model_id = ? and
                sku = ? and
                quantity = ? and
                deleted_at is null
            `, [req.body.filament_brand_id, req.body.filament_material_id, req.body.printer_model_id, req.body.sku, req.body.quantity]);

        if(rows.length > 0){
            return apiClientError(req, res, [], `Este produto ja foi adicionado`, 400)
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
            message: "Product created successfully",
            data: data,
        }
    );
});

router.post('/:id/gcode', param('id').isInt(), upload_gcode.single('file'), validateToken, async (req, res) => {
    const id = req.params.id;
    const mysql_table = "files";

    if (!req.file) {
        return res.status(400).json({
            method: req.method,
            error: true,
            code: 400,
            message: "No image file uploaded.",
            data: []
        })
    }

    try {
        await checkExistence([
            {
                id: id,
                table: "products",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        if(!req.file.filename.includes(".gcode")){
            return apiClientError(req, res, [], "O arquivo inserido não é um gocde.", 400)
        }

        await db.query(`insert into files(type, path) values(?, ?);`, ["gcode", `${req.file.filename}`]);
        const [rows_1] = await db.query(`select id from files order by id desc limit 1`);
        await db.query(`update products set file_id = ? where id = ?`, [rows_1[0].id, id])
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(201).json(
        {
            method: req.method,
            error: false,
            code: 201,
            message: "File uploaded successfully",
            data: [],
        }
    );
});

router.post('/:id/image', param('id').isInt(), upload_image.single('file'), validateToken, async (req, res) => {
    const id = req.params.id;
    const mysql_table = "files";

    if (!req.file) {
        return res.status(400).json({
            method: req.method,
            error: true,
            code: 400,
            message: "No image file uploaded.",
            data: []
        })
    }

    try {
        await checkExistence([
            {
                id: id,
                table: "products",
                field: "params 'id'"
            },
        ])
    } catch (error) {
        return apiClientError(req, res, error, error.message, 400)
    }

    try {
        const fileName = req.file.filename.toLowerCase();

        if (!fileName || !fileName.match(/\.(png|jpg|jpeg)$/)) {
            return apiClientError(req, res, [], "O arquivo inserido deve ser uma imagem (png, jpg, jpeg).", 400)
        }

        await db.query(`update products set image_path = ? where id = ?`, [req.file.filename, id]);
    } catch (error) {
        return apiServerError(req, res, error);
    }

    res.status(201).json(
        {
            method: req.method,
            error: false,
            code: 201,
            message: "File uploaded successfully",
            data: [],
        }
    );
});

router.delete('/:id', param('id').isInt(), validateToken, checkRole("admin"), async (req, res) => {
    const id = req.params.id;

    const mysql_table = "products";

    try {
        await checkExistence([
            {
                id: id,
                table: "products",
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
            message: "Product deleted successfully",
            data: [],
        }
    );
});

module.exports = router;