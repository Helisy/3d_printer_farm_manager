const express = require('express');
const router = express.Router();
const axios = require("axios");
const { validateToken, checkRole } = require('../../../middleware/authMiddleware');


router.get('/get-all-stock', validateToken, async (req, res) => {
    let raw;
    try {
        const data = await axios.post(
            "https://api.baselinker.com/connector.php",
            new URLSearchParams({
                method: 'getInventoryProductsList',
                parameters: JSON.stringify({"inventory_id": req.query.inventory_id, "include_variants": req.query.type == "children"}),
            }),
            {
                headers: {
                'X-BLToken': process.env.BASELINKER_API_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 20000,
            }
        );

        if(req.query.type == "children"){
            raw = Object.values(data.data.products).filter(e => e.parent_id !== 0);
        }else{
            raw = Object.values(data.data.products);
        }

    } catch (error) {
        return res.status(500).json(
        {
            method: req.method,
            error: true,
            code: 500,
            message: "error",
            data: [],
        }
    );
    }

    res.status(200).json(
        {
            method: req.method,
            error: false,
            code: 200,
            message: "Success",
            data: raw,
        }
    );
});


router.post('/update-stock', validateToken, async (req, res) => {
    let current_stock;

    try {
        const data = await axios.post(
            "https://api.baselinker.com/connector.php",
            new URLSearchParams({
                method: 'getInventoryProductsList',
                parameters: JSON.stringify({inventory_id: req.body.inventory_id, filter_sku: req.body.sku, include_variants: true}),
            }),
            {
                headers: {
                'X-BLToken': process.env.BASELINKER_API_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 20000,
            }
        );

        current_stock = Object.values(data.data.products)[0].stock;

    } catch (error) {
        return res.status(500).json(
            {
                method: req.method,
                error: true,
                code: 500,
                message: "Erro ao comuncar com a Base.",
                data: [],
            }
        );
    }



    const [key, value] = Object.entries(current_stock)[0];

    if(value != req.body.stock[key]){
        return res.status(500).json(
            {
                method: req.method,
                error: true,
                code: 500,
                message: "Erro de Sincronia, Execute a ação novamente.",
                data: [],
            }
        );
    }

    const newStockValue = req.body.action == 'add' ? value + Number(req.body.value) : value - Number(req.body.value);

    if(newStockValue < 0){
        return res.status(500).json(
            {
                method: req.method,
                error: true,
                code: 500,
                message: "O valor em estoque não pode ser negativo.",
                data: [],
            }
        );
    }

    try {
        await axios.post(
            "https://api.baselinker.com/connector.php",
            new URLSearchParams({
                method: 'updateInventoryProductsStock',
                parameters: JSON.stringify({inventory_id: req.body.inventory_id, products: {[req.body.product_id]: {[key]: newStockValue}}}),
            }),
            {
                headers: {
                'X-BLToken': process.env.BASELINKER_API_TOKEN,
                'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: 20000,
            }
        );

        } catch (error) {
            return res.status(500).json(
                {
                    method: req.method,
                    error: true,
                    code: 500,
                    message: "Erro ao comuncar novo valor a Base.",
                    data: [],
                }
            );
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

module.exports = router;