const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "job-portal-7e8a5.web.app",
      "https://musical-conkies-1478b1.netlify.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("mere tere dos ho medilware");
  next();
};

const Verifytoken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log(req);
  if (!token) {
    return res.status(401).send({ message: "unAuthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    console.log(decoded);
    next();
  });
};

// DB_USER : job_hunter

//PAS_USER : u9QkOn8tVq8o8qn6

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PAS_USER}@cluster0.uvwcv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Send a ping to confirm a successful connection

    const jobcolletion = client.db("jobportal").collection("Jobs");
    const jobapliction = client.db("jobportal").collection("aplication");
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const coursor = jobcolletion.find(query);
      const result = await coursor.toArray();
      res.send(result);
    });
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobcolletion.findOne(query);
      res.send(result);
    });

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        })
        .send({ success: true });
    });

    app.post("/jobs", async (req, res) => {
      const newjobs = req.body;
      const result = await jobcolletion.insertOne(newjobs);
      res.send(result);
    });
    app.post("/jobs-application", async (req, res) => {
      const application = req.body;
      const result = await jobapliction.insertOne(application);

      // job_id sarche

      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobcolletion.findOne(query);
      let count = 0;
      if (job.applicationCount) {
        count = job.applicationCount + 1;
      } else {
        count = 1;
      }
      const filter = { _id: new ObjectId(id) };
      const updatedoc = {
        $set: {
          applicationCount: count,
        },
      };
      const updatedata = await jobcolletion.updateOne(filter, updatedoc);
      res.send(result);
    });
    // S2312332@email.com
    // s2312332@email.com
    app.get("/jobs-application", Verifytoken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant: email };
      console.log(req.user.email);
      console.log(req.query.email);
      if (req.user.email != req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const result = await jobapliction.find(query).toArray();

      for (const application of result) {
        console.log(application.job_id);
        const query1 = { _id: new ObjectId(application.job_id) };
        const job = await jobcolletion.findOne(query1);
        if (job) {
          application.title = job.title;
          application.location = job.location;
          application.jobType = job.jobType;
          application.category = job.category;
          application.applicationDeadline = job.applicationDeadline;
          application.salaryRange = job.salaryRange;
          application.description = job.description;
          application.company = job.company;
          application.requirements = job.requirements;
          application.responsibilities = job.responsibilities;
          application.status = job.status;
          application.hr_email = job.hr_email;
          application.hr_name = job.hr_name;
          application.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });
    app.get("/jobs-application/jobs/:job_id", async (req, res) => {
      const jobid = req.params.job_id;
      const query = { job_id: jobid };
      const result = await jobapliction.find(query).toArray();
      res.send(result);
    });

    app.patch("/jobs-application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedoc = {
        $set: {
          status: data.status,
        },
      };
      const result = await jobapliction.updateOne(query, updatedoc);
      res.send(result);
    });

    app.delete("/jobs-application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobapliction.deleteOne(query);
      res.send(result);
    });
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Project Server is Running");
});

app.listen(port, () => {
  console.log(`  Server is Running ${port}`);
});
