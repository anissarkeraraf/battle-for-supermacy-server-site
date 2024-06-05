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

    app.get('/doner/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donerCollection.findOne(query);
      res.send(result);
    })

    app.patch('/doner/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await donerCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    app.get('/doners/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await donerCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    // Donor Request 
    app.post('/donorRequest', async (req, res) => {
      const donerRequest = req.body;
      console.log(donerRequest);
      const result = await donerRequestCollection.insertOne(donerRequest);
      res.send(result);
    });

    app.get('/donorRequest', async (req, res) => {
      const cursor = donerRequestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/donorRequest/:email', async (req, res) => {
      const result = await donerRequestCollection.find({ email: req.params.email }).toArray();
      res.send(result)
    })

    app.get('/donorRequests/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donerRequestCollection.findOne(query);
      res.send(result);
    })

    app.delete('/donorRequests/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donerRequestCollection.deleteOne(query);
      res.send(result);
    })

    app.put('/donorRequests/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }; 
      const updatedDoc = {
        $set: {
          name: item.name,
          email: item.email,
          bloodGroup: item.bloodGroup,
          district: item.district,
          upazila: item.upazila,
          address: item.address,
          recipientName: item.recipientName,
          donationDate: item.donationDate,
          donationTime: item.donationTime,
          hospitalName: item.hospitalName,
          requestMessage: item.requestMessage
        }
      }
      const result = await donerCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })


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
