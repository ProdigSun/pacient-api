const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://rafapili1:KJVHVnoRapNXV48z@cluster0.a4dwr.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
var jwt = require("jsonwebtoken");
var fs = require("fs");
const expressJwt = require('express-jwt');


var express = require("express");

const RSA_PRIVATE_KEY = fs.readFileSync("./demos/mykey.pem");
const RSA_PUBLIC_KEY = fs.readFileSync('./demos/pubkey.pem');

const checkIfAuthenticated = expressJwt({
  secret: RSA_PUBLIC_KEY
}); 


let dbConnection;

client.connect(function (err, db) {
  if (err || !db) {
    return callback(err);
  }

  dbConnection = db.db("patient_db");
  console.log("Successfully connected to MongoDB.");
});

async function app() {
  var app = express();

  //Here we are configuring express to use body-parser as middle-ware.
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.route("/login").post(loginRoute);

  app.post("/patient", async function (req, res) {
    dbConnection.collection("patient").insertOne({
      id: uuidv4(),
      ...req.body,
      date_created: Date(),
    });
    res.set('Access-Control-Allow-Origin', 'patient-chat.herokuapp.com')
    res.send(req.body);
  });

  app.post("/user", async function (req, res) {
    dbConnection.collection("user").insertOne({
      id: uuidv4(),
      ...req.body,
      date_created: Date(),
    });
    res.send(req.body);
  });

  app.post("/patient/update", async function (req, res) {
    console.log(req.body.id);
    dbConnection.collection("patient").updateOne(
      {
        id: req.body.id,
      },
      {
        $set: {
          status: req.body.status,
        },
      }
    );
    res.send(req.body);
  });

  app.get("/", async function (req, res) {
    res.send("Healthy");
  });

  app.route("/patients").get(checkIfAuthenticated, async function (req, res) {
    dbConnection
      .collection("patient")
      .find({})
      .limit(50)
      .toArray((err, result) => {
        res.send(result);
      });
  });

  app.listen(process.env.PORT || 3000, function () {
    console.log("server listening on port 3000!");
  });

  function loginRoute(req, res) {
    const email = req.body.email,
      password = req.body.password;

    dbConnection
      .collection("user")
      .find({ email: email, password: password })
      .limit(1)
      .toArray((err, result) => {
        console.log(result);
        if (result.length == 0) {
          res
          .status(401)
          .send()

          return
        }
        const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
          algorithm: "RS256",
          expiresIn: 1000000,
          subject: email,
        });

        res.status(200).json({
          idToken: jwtBearerToken,
          expiresIn: 1000000,
        });
      });
  }
}

app();
