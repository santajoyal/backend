const express = require("express");
const cors = require("cors");
const mongodb = require("mongodb");
const mongoclient = mongodb.MongoClient;
const app = express();
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.jwt_secret;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

let authorize = (req, res, next) => {
  try {
    console.log(req.headers);
    if (req.headers.authorization) {
      let decodedtoken = jwt.verify(req.headers.authorization, jwt_secret);
      if (decodedtoken) {
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

app.post("/user/register", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    var salt = await bcrypt.genSalt(10);
    var hash = await bcrypt.hash(req.body.password, salt);
    req.body.password = hash;

    const user = await db.collection("users").insertOne(req.body);
    await connection.close();
    res.json({ message: "User Created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.post("/user/login", async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        const token = jwt.sign({ _id: user._id }, jwt_secret, {
          expiresIn: "10m",
        });
        res.json({ message: "sucess", token });
      } else {
        res.json({ message: "Incorrect username/password" });
      }
    } else {
      res.status(404).json({ message: "Incorrect username/password" });
    }
  } catch (error) {
    console.log(error);
  }
});

//create
app.post("/students", authorize, async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const student = await db.collection("students").insertOne(req.body);
    await connection.close();
    res.json({ message: "student created", id: student.insertedId });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//get
app.get("/students", authorize, async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const student = await db.collection("students").find({}).toArray();
    await connection.close();
    res.json(student);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//update
app.put("/student/:studentId", authorize, async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const studentdata = await db
      .collection("students")
      .findOne({ _id: mongodb.ObjectId(req.params.studentId) });
    if (studentdata) {
      delete req.body._id;
      const student = await db
        .collection("students")
        .updateOne(
          { _id: mongodb.ObjectId(req.params.studentId) },
          { $set: req.body }
        );
      await connection.close();
      res.json(student);
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//view one user
app.get("/student/:studentId", authorize, async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const student = await db
      .collection("students")
      .findOne({ _id: mongodb.ObjectId(req.params.studentId) });
    await connection.close();
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ message: "student not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//delete
app.delete("/student/:studentId", authorize, async (req, res) => {
  try {
    const connection = await mongoclient.connect(URL);
    const db = connection.db("student-crud");
    const studentdata = await db
      .collection("students")
      .findOne({ _id: mongodb.ObjectId(req.params.studentId) });
    if (studentdata) {
      const student = await db
        .collection("students")
        .deleteOne({ _id: mongodb.ObjectId(req.params.studentId) });
      await connection.close();
      res.json(student);
    } else {
      res.status(404).json({ message: "student not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

app.listen(process.env.PORT || 3004);
