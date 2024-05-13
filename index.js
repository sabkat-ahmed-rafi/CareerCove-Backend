const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: "GET,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

const user = process.env.MONGODB_USER;
const key = process.env.MONGODB_KEY;

const uri = `mongodb+srv://${user}:${key}@backendtest.ldjqqhi.mongodb.net/?retryWrites=true&w=majority&appName=backendTest`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("CareerCove");
    const user = database.collection("user");
    const allJobs = database.collection("allJobs");
    const appliedJobs = database.collection("appliedJobs");

    // Showing user in the UI
    app.get("/user", async (req, res) => {
      const result = await user.find().toArray();
      res.send(result);
    });

    // Showing all jobs in the UI
    app.get("/allJobs", async (req, res) => {
      const search = req.query.search;
      const email = req.query.email;
      const onSite = req.query.onSite;
      const remote = req.query.remote
      const hybrid = req.query.hybrid
      const partTime = req.query.partTime

      if (search) {
        const query = { title: { $regex: search, $options: "i" } };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      } else if (email) {
        const query = { email: email };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      } else if (onSite) {
        const query = { jobOption: onSite };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      } else if (remote) {
        const query = { jobOption: remote };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      } else if (hybrid) {
        const query = { jobOption: hybrid };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      } else if (partTime) {
        const query = { jobOption: partTime };
        const result = await allJobs.find(query).toArray();
        res.send(result);
      }  else {
        const result = await allJobs.find({}).toArray();
        res.send(result);
      }
    });

    // Showing Single job post in the UI
    app.get("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allJobs.findOne(query);
      res.send(result);
    });

    // showing single route for update a job
    app.get("/updateJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allJobs.findOne(query);
      res.send(result);
    });

    // Showing applied jobs in the UI
    app.get("/appliedJobs", async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) query = { jobOption: filter };
      const result = await appliedJobs.find(query).toArray();
      res.send(result);
    });

    // Saving user info in the Database Using Cloudinary and Multer
    app.post("/user", upload.single("photo"), async (req, res) => {
      try {
        const { name, email } = req.body;
        const photo = req.file.path;

        const result = await cloudinary.uploader.upload(photo);

        const photoUrl = result.secure_url;
        const userResult = await user.insertOne({ name, email, photoUrl });
        res.send(userResult);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error uploading image");
      }
    });

    // Save job post to the database
    app.post("/allJobs", async (req, res) => {
      const jobInfo = req.body;
      const result = await allJobs.insertOne(jobInfo);
      res.send(result);
    });

    // Saving applied jobs on database
    app.post("/appliedJobs", async (req, res) => {
      const { _id } = req.body.appliedJobsInfo;
      const jobId = _id;
      const updateApplicantResult = await allJobs.updateOne(
        { _id: new ObjectId(jobId) },
        { $inc: { applicantNumber: 1 } }
      );
      const {
        title,
        photo,
        description,
        salary,
        jobDeadline,
        jobOption,
        postDate,
        applyerName,
        applyerEmail,
        cv,
      } = req.body.appliedJobsInfo;

      const appliedJobsResult = await appliedJobs.insertOne({
        title,
        photo,
        description,
        salary,
        jobDeadline,
        jobOption,
        postDate,
        applyerName,
        applyerEmail,
        cv,
      });
      res.send();
    });

    // make route for update a job
    app.put("/updateJobs/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id, req.body);
      const updateResult = await allJobs.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
      res.send(updateResult);
    });

    // Made a route for delete
    app.delete("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const deleteResult = await allJobs.deleteOne({ _id: new ObjectId(id) });
      res.send(deleteResult);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World rafi!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
