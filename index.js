const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

//verify jwt token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }

    // it will carry bearer token thats why it has to split 
    const token = authorization.split(" ")[1]

    jwt.verify(token, process.env.JSON_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' });
        }

        req.decoded = decoded;
        next();
    })

}

//testing
app.get("/", (req, res) => {
    res.send(`career matcher pro server is running in port no ${port}`);
})

// database connection


const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.ectfhk2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.db("admin").command({ ping: 1 });
        await client.connect();

        const userCollection = client.db("career-matcher-pro").collection("user");

        app.post("/user", verifyJWT, async (req, res) => {
            const data = req.body;
            console.log(data);
            const email = data.email;
            const query = { email: email };
            const find = await userCollection.findOne(query);

            if (find) {
                return res.send({ message: "User Already Registered" });
            }

            const result = await userCollection.insertOne(data);
            res.send(result);

        })


        // jwt token

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JSON_SECRET_KEY, { expiresIn: "1h" })
            res.send({ token })

        })
        
        // Send a ping to confirm a successful connection
        
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log("Server is running in bg")
})