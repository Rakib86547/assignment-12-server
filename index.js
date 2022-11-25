const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tiiizrg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoriesCollection = client.db('carMaster').collection('categories');
        const allCategoriesCollection = client.db('carMaster').collection('allCategorie');
        const usersCollection = client.db('carMaster').collection('users');

        app.get('/category', async (req, res) => {
            const query = {}
            const result = await allCategoriesCollection.find(query).toArray();
            res.send(result)
        })
        // all category car get
        app.get('/all_categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        });

        // save users
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(error => console.log(error));

app.get('/', (req, res) => {
    res.send('api is running')
});

app.listen(port, (req, res) => {
    console.log(`server is running on ${port}`)
})