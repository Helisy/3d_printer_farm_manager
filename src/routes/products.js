const express = require('express');
const router = express.Router();

const { validateTokenClient } = require("../middleware/authMiddleware");

router.get('/', validateTokenClient, async (req, res) => {
   res.render("products/products.ejs");
});


module.exports = router;