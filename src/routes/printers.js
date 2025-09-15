const express = require('express');
const router = express.Router();

const { validateTokenClient } = require("../middleware/authMiddleware");

const database = require('../database');
const db = database();

// router.get('/', validateTokenClient, async (req, res) => {
//     res.redirect("/printers/list");
// });


router.get('/', validateTokenClient, async (req, res) => {
    res.render("printers/printers_list.ejs");
});

router.get('/:id', validateTokenClient, async (req, res) => {
    const id = req.params.id;
    const [rows_1] = await db.execute("select id from printers where id = ?", [id]);

    if(rows_1.length < 1){
        res.redirect("/printers");
        return;
    }

    res.render("printers/printer.ejs");
});



module.exports = router;