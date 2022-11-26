const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tiiizrg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify jwt function
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if(!authHeader) {
        return res.status(403).send({message: "unauthorized access"});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function(err, decoded) {
        if(err) {
            return res.status(401).send({message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })
}
async function run() {
    try {
        const categoriesCollection = client.db('carMaster').collection('categories');
        const allCategoriesCollection = client.db('carMaster').collection('allCategorie');
        const usersCollection = client.db('carMaster').collection('users');
        const bookingsCollection = client.db('carMaster').collection('bookings');

        app.get('/category', async (req, res) => {
            const query = {}
            const result = await allCategoriesCollection.find(query).toArray();
            res.send(result)
        })
        // all category car get
        app.get('/all_categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            // const query = {_id:Object(id)}
            const result = await categoriesCollection.find(query).toArray();
            res.send(result);
        });

        // save users
        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result)
        });

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            if(user) {
                const token = jwt.sign({email}, process.env.ACCESS_JWT_TOKEN, {expiresIn: '1d'});
                return res.send({accessToken: token})
            }
            res.status(401).send({accessToken: ''});
        });
        // save bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // get bookings
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const result = await bookingsCollection.find(query).toArray();
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