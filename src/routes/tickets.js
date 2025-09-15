const express = require('express');
const router = express.Router();

const { validateTokenClient, checkRoleClient } = require("../middleware/authMiddleware");

const database = require('../database');
const db = database();

router.get('/', validateTokenClient, checkRoleClient("admin"), async (req, res) => {
   res.render("tickets/tickets_list.ejs");
});

router.get('/:id', validateTokenClient, checkRoleClient("admin"), async (req, res) => {
   const id = req.params.id;
   const [rows_1] = await db.execute("select id from tickets where id = ?", [id]);

   if(rows_1.length < 1){
      res.redirect("/tickets");
      return;
   }

   res.render("tickets/ticket.ejs");
});

module.exports = router;