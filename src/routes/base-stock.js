const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.redirect("/base-stock/home");
});

router.get('/home', async (req, res) => {
    res.render("base-stock/home.ejs");
});

router.get('/:company_name', async (req, res) => {

    if(!req.query.inventory_id) return res.redirect("/base-stock/home");
    if(!req.query.type) return res.redirect("/base-stock/home");
    if(req.query.type != "father" && req.query.type != "children") return res.redirect("/base-stock/home");

    res.render("base-stock/stock.ejs");
});


module.exports = router;