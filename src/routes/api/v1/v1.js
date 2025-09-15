require('dotenv').config();

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.status(400).json(
        {
            method: "GET",
            error: false,
            code: 400,
            message: "API version 1.0.0.",
            data: [],
            // links: [
            // ]
        }
    );
});


const authRouter = require('./auth');
router.use("/auth", authRouter);

const printersRouter = require('./printers');
router.use("/printers", printersRouter);

const usersRouter = require('./users');
router.use("/users", usersRouter);

const jobsRouter = require('./jobs');
router.use("/jobs", jobsRouter);

const productsRouter = require('./products');
router.use("/products", productsRouter);

const ticketsRouter = require('./tickets');
router.use("/tickets", ticketsRouter);


module.exports = router;