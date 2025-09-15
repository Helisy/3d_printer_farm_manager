require('dotenv').config();

// const database = require('./src/database');
// const db = database();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT;
const HOST_IP = process.env.HOST_IP;

// app.use(express.json());
// app.use(express.urlencoded({extended: false}));


app.use('/public', express.static('public'));
app.use(cors());
app.use(express.json({limit: "10mb", extended: true}))
app.use(express.urlencoded({limit: "10mb", extended: true, parameterLimit: 5000}))
app.use(cookieParser());

app.set('view engine', 'ejs');


// Routers

app.use("/api", require('./src/routes/api/api'));
// app.use("/dashboard", require('./src/routes/dashboard'));

// app.use("/jobs", require('./src/routes/jobs'));
app.use("/printers", require('./src/routes/printers'));
app.use("/products", require('./src/routes/products'));
app.use("/config", require('./src/routes/config'));
app.use("/auth", require('./src/routes/auth'));
app.use("/users", require('./src/routes/users'));
app.use("/tickets", require('./src/routes/tickets'));



/***/

app.get('/', async (req, res) => {
    res.redirect("/printers");
});

app.use((req, res) =>{
    res.redirect("/");
})

app.listen(PORT, HOST_IP, () => {
    console.log(`Server listening on ${HOST_IP}:${PORT}.`);
});
  