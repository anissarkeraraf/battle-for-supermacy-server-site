const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    // await client.connect();

    const donerCollection = client.db('bloodBuddies').collection('doner');
    const donerRequestCollection = client.db('bloodBuddies').collection('donorRequest');
    const blogsCollection = client.db('bloodBuddies').collection('blogs');

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token });
    })

    // middlewares
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden access' })
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
      })

    }

    // Endpoint to add a donor
    app.post('/doners', async (req, res) => {
      const donerService = req.body;
      console.log(donerService);
      const result = await donerCollection.insertOne(donerService);
      res.send(result);
    });

    app.get('/doners', async (req, res) => {
      try {
        const { status, page = 1, perPage = 10 } = req.query;
        const query = {};



        // Apply the status filter if it's provided and not 'all'
        if (status && status !== 'all') {
          query.status = status;
        }

        const pageNumber = parseInt(page, 10);
        const limit = parseInt(perPage, 10);
        const skip = (pageNumber - 1) * limit;

        // Fetch users with the specified filter, pagination, and limit
        const users = await donerCollection.find(query).skip(skip).limit(limit).toArray();

        res.json(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });


    app.get('/doners/:email', async (req, res) => {
      const result = await donerCollection.find({ email: req.params.email }).toArray();
      res.send(result)
    })

    app.get('/doner/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donerCollection.findOne(query);
      res.send(result);
    })

    // Update Donor Route
    app.patch('/doners/:email', async (req, res) => {
      const item = req.body;
      const email = req.params.email;
      const filter = { email: email }
      const updateDoc = {
        $set: {
         name: item.name,
         Image: item.image,
         district: item.district,
         upazila: item.upazila,
         bloodGroup: item.bloodGroup
        }
      }
      const result = await donerCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    // Admin 

    app.get('/doner/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }

      const query = { email: email };
      const doner = await donerCollection.findOne(query);
      let admin = false;
      if (doner) {
        admin = doner?.role === 'admin';
      }
      res.send({ admin });
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

    // Volunteer
    app.patch('/doner/volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'volunteer'
        }
      }
      const result = await donerCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // Block 
    app.patch('/doner/block/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'block'
        }
      }
      const result = await donerCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    // UnBlock
    app.patch('/doner/Unblock/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'unblock'
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

    app.patch('/donorRequest/pending/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'pending'
        }
      }
      const result = await donerRequestCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

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

    app.get('/donorRequests/:id', async (req, res) => {
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
      const result = await donerRequestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // Blogs
    app.post('/blogs', async (req, res) => {
      const blogs = req.body;
      console.log(blogs);
      const result = await blogsCollection.insertOne(blogs);
      res.send(result);
    });

    app.get('/blogs', async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    })

    app.delete('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/blogs/published/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'published'
        }
      }
      const result = await blogsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })

    app.patch('/blogs/draft/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'draft'
        }
      }
      const result = await blogsCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


// Endpoint to create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
      const { price } = req.body;

      // Validate price
      if (typeof price !== 'number' || price <= 0) {
          return res.status(400).send({ error: 'Invalid price parameter' });
      }

      // Convert price to cents
      const amount = parseInt(price * 100);

      // Log the amount for debugging
      console.log(`Creating payment intent for amount: ${amount}`);

      // Create the payment intent
      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
      });

      // Send the client secret to the frontend
      res.send({
          clientSecret: paymentIntent.client_secret
      });
  } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).send({ error: error.message });
  }
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
