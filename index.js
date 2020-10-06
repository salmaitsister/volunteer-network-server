const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lmoae.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(cors())
app.use(bodyParser.json());

const serviceAccount = require("./volunteer-network00-firebase-adminsdk-pe49g-f0f997f65e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-network00.firebaseio.com"
});


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const activitiesCollection = client.db("volunteerNetwork").collection("activities");
  const registerCollection = client.db("volunteerNetwork").collection("userData");

  app.post('/addActivities', (req, res) => {
    const volunteerActivities = req.body;
    activitiesCollection.insertOne(volunteerActivities)
    .then(result => {
      console.log(result)
      res.send(result)
    })
  })

  app.get('/allActivities', (req, res) => {
    activitiesCollection.find({})
    .toArray((err, documents) => {
      res.send(documents)
    })
  })

  app.post('/register', (req, res) => {
    const registerData = req.body;
    registerCollection.insertOne(registerData)
    .then(result => {
      console.log(result)
      res.send(result)
    })
  })

  app.get('/allRegistedActivity', (req, res) => {
    registerCollection.find({})
    .toArray((err, documents) => {
      res.send(documents)
    })
  })

  app.get('/allRegister', (req, res) => {
    const bearer = req.headers.authorization;

    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];

      admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;

          if(tokenEmail == queryEmail){
            registerCollection.find({email: queryEmail})
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })
          }
          else{
            res.status(401).send('un-authorized access')
          }
        })
        .catch(function(error) {
          res.status(401).send('un-authorized access')
        });
    } 
    else{
      res.status(401).send('un-authorized access')
    }
  })

  app.delete('/deleteActivity/:id', (req, res) => {
    registerCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
});


app.listen(process.env.PORT || 5000)