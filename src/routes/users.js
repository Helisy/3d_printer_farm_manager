const express = require('express');
const router = express.Router();

const { validateTokenClient, checkRoleClient } = require("../middleware/authMiddleware");

router.get('/', validateTokenClient, checkRoleClient("admin"), async (req, res) => {
   res.render("users/users.ejs");
});


module.exports = router;