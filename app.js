const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://rafapili1:KJVHVnoRapNXV48z@cluster0.a4dwr.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid');

var express = require('express');

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

  app.post('/patient', async function (req, res) {
    dbConnection.collection("patient")
      .insertOne({
        id: uuidv4(),
        ...req.body,
        date_created: Date()
      })
    res.send(req.body);
  })

  app.post('/patient/update', async function (req, res) {
    dbConnection.collection("patient")
      .updateOne({
        _id: req.body.id
      }, {
          $set: {
            status: req.body.status
          }
       })
    res.send(req.body);
  });

  app.get('/', async function (req, res) {
    res.send('Healthy');
  });

  app.get('/patients', async function (req, res) {
    dbConnection.collection("patient")
      .find({}).limit(50)
      .toArray((err, result) => {
        res.send(result)
      })
  });

  app.listen((process.env.PORT || 3000), function () {
    console.log('server listening on port 3000!');
  });
}

app();
