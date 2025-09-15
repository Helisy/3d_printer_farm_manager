const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.redirect("/jobs/list");
});


router.get('/list', async (req, res) => {
    res.render("jobs/jobs_list.ejs");
});


module.exports = router;