const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
    if (!authHeader) {
        return res.status(403).send({ message: "unauthorized access" });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
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
        const seller_BookingsCollection = client.db('carMaster').collection('seller_bookings');
        const paymentsCollection = client.db('carMaster').collection('payments');

        // verify admin 
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            console.log(user?.role)
            if (user?.role !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next()
        }

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

        // get user role 
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.findOne(query);
            res.send(result)
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_JWT_TOKEN, { expiresIn: '1d' });
                return res.send({ accessToken: token })
            }
            res.status(401).send({ accessToken: '' });
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
            const query = { email: email };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result)
        });

        // save seller products
        app.post('/seller_bookings', async (req, res) => {
            const bookings = req.body;
            const result = await seller_BookingsCollection.insertOne(bookings);
            res.send(result);
        });

        // get seller products
        app.get('/seller_bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await seller_BookingsCollection.find(query).toArray();
            res.send(result);
        });

        app.put('/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'unsold'
                }
            };
            const result = await seller_BookingsCollection.updateOne(filter, updateDoc, options);
            res.send(result);
            console.log(result)
        });

        app.get('/all_sellers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        // get all seller
        app.get('/all_sellers', verifyJWT, async (req, res) => {
            const query = { role: "Seller" };
            const user = await usersCollection.find(query).toArray();
            res.send(user)
        });

        // delete seller
        app.delete('/all_sellers/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })

        // get all buyers
        app.get('/all_buyers', verifyJWT, async (req, res) => {
            const query = { role: "User" };
            const buyers = await usersCollection.find(query).toArray();
            res.send(buyers);
        });

        // delete buyers
        app.delete('/all_buyers/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        });

        // api for payment
        app.post('/create_payment_intent', async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });

        })

        // get information for payment
        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingsCollection.findOne(query);
            res.send(result)
        });

        // save payment information
        app.post('/payment', async (req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = req.booking_id;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true
                }
            }

            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
            res.send(result);
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