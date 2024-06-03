const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfaqolh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server
    await client.connect();

    const donerCollection = client.db('bloodBuddies').collection('doner');
    const donerRequestCollection = client.db('bloodBuddies').collection('donorRequest');

    // Endpoint to add a donor
    app.post('/doners', async (req, res) => {
      const donerService = req.body;
      console.log(donerService);
      const result = await donerCollection.insertOne(donerService);
      res.send(result);
    });

    app.get('/doners', async (req, res) => {
      const cursor = donerCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/doners/:email', async (req, res) => {
      const result = await donerCollection.find({ email: req.params.email }).toArray();
      res.send(result)
    })

    app.patch('/doners/:email', async (req, res) => {
      const item = req.body;
      const email = req.params.email;
      const filter = { email: email }; // No ObjectId conversion here
      const updatedDoc = {
        $set: {
          name: item.name,
          bloodGroup: item.bloodGroup,
          district: item.district,
          upazila: item.upazila,
          image: item.image // added image field
        }
      }
      const result = await donerCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // Donor Request 
    app.post('/donorRequest', async (req, res) => {
      const donerRequest = req.body;
      console.log(donerRequest);
      const result = await donerRequestCollection.insertOne(donerRequest);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Start the server
    app.listen(port, () => {
      console.log(`Backend is running on ${port}`);
    });

  } catch (err) {
    console.error(err);
  }
}

// Run the server
run().catch(console.dir);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Backend is Running');
});
