const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.render("template/template.ejs");
});


module.exports = router;