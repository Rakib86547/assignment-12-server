const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware 
app.use(cors());
app.use(express.json());




app.get('/', (req, res) => {
    res.send('api is running')
});

app.listen(port, (req, res) => {
    console.log(`server is running on ${port}`)
})