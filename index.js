const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

const client = new MongoClient(
  process.env.DB_Connect,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  }
);

async function run() {
  try {
    await client.connect();
    const inventoryCollection = client.db("Shoelace").collection("inventory");

    //Auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    //Get data from mongo DB
    app.get("/inventory", async (req, res) => {
      const email = req.query.email;
      let query;
      if (email) {
        query = { email: email };
      } else {
        query = {};
      }
      const cursor = inventoryCollection.find(query);
      const inventory = await cursor.toArray();
      res.send(inventory);
    });

    //MyItem  Data with JWT
    app.get("/myInventory", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = inventoryCollection.find(query);
        const inventory = await cursor;
        res.send(inventory);
      }
    });

    //Get Specific data from mongo DB
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = inventoryCollection.find(query);
      const inventory = await cursor;
      res.send(inventory);
    });

    //Add Product
    app.post("/inventory", async (req, res) => {
      const newProduct = req.body;
      const result = await inventoryCollection.insertOne(newProduct);
      res.send(result);
    });

    //Delete Product
    app.delete("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
    });

    //Modify Product

    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updateQuantity = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateQuantity,
      };
      const result = await inventoryCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Shoeless is running!");
});

app.listen(port, () => {
  console.log("Listening to port: ", port);
});
