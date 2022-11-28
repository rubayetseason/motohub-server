const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
const stripe = require("stripe")(process.env.STRIPE_SECRET);

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsmlaiu.mongodb.net/test`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.tsmlaiu.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const productsCollection = client.db("motoHub").collection("bikes");
    const bookingsCollection = client.db("motoHub").collection("bookings");
    const advertiseCollection = client.db("motoHub").collection("advertise");
    const usersCollection = client.db("motoHub").collection("users");
    const paymentsCollection = client.db("motoHub").collection("payments");
    const wishlistCollection = client.db("motoHub").collection("wishlist");

    //product part here
    app.get("/products", async (req, res) => {
      const uid = req.query.uid;
      let query = {};
      if (uid) {
        query = { uid: uid };
      }
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    app.get("/products/:brand", async (req, res) => {
      const brand = req.params.brand;
      const query = { catagory: brand };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    //booking part here

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.findOne(query);
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //advertise part here

    app.get("/advertise", async (req, res) => {
      const query = {};
      const result = await advertiseCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/advertise", async (req, res) => {
      const product = req.body;
      const result = await advertiseCollection.insertOne(product);
      res.send(result);
    });

    //users part here

    app.get("/users", async (req, res) => {
      const role = req.query.role;
      let query = {};
      if (role) {
        query = { role: role };
      }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    //payment part here

    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.resale_price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });

    //wishlist part here
    // app.post("/users", async (req, res) => {
    //   const user = req.body;
    //   const result = await usersCollection.insertOne(user);
    //   res.send(result);
    // });

    app.get("/wishlist", async (req, res) => {
      const uid = req.query.uid;
      const query = { uid: uid };
      const result = await wishlistCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/wishlist", async (req, res) => {
      const product = req.body;
      const result = await wishlistCollection.insertOne(product);
      res.send(result);
    });
  } finally {
  }
}

run().catch((error) => console.log(error));

app.get("/", (req, res) => {
  res.send("Motohub server running");
});

app.listen(port, () => {
  console.log(`Motohub server running on ${port}`);
});
