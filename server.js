
const express = require("express");
const mongo = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const crypto = require("crypto");

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express();
const url = "mongodb://"+process.env.DB_USER+":"+process.env.DB_PASS+"@"+process.env.DB_HOST+":"+process.env.DB_PORT+"/"+process.env.DB_NAME;

app.use(express.static("public"));


app.get("/", (request, response) => {
  response.sendFile(__dirname + '/views/index.html')
});


app.post("/user", urlencodedParser, (req, res, next) => {      
  res.set('Content-Type', "application/json");  
  mongo.connect(url, function (err, client) {
      if (err) res.end("Error connectin to database");      
    
      const glitch_db = client.db("glitch");
      const coll = glitch_db.collection("exercise-tracker");     
      let userID = crypto.randomBytes(3).toString('hex');
      let obj = {"name": req.body.name, "userID": userID, "exercises": []};      

      coll.insertOne(obj, {forceServerObjectId: true}, (err, data) => {
        if(err) res.send(err); 
        else {res.send(obj); client.close();}
      });     
    });
});

app.post("/exercise", urlencodedParser, (req, res, next) => {      
  res.set('Content-Type', "application/json");  
  mongo.connect(url, function (err, client) {
      if (err) res.end("Error connectin to database");      
    
      const glitch_db = client.db("glitch");
      const coll = glitch_db.collection("exercise-tracker");           
      let obj = {"description": req.body.description, "duration": req.body.duration, "date": req.body.date};      

      coll.updateOne({"userID": req.body.userID}, {$push: {"exercises": obj}}, (err, doc) => {
        if(err) res.send(err); 
        else {res.send(obj); client.close();}
      });
    });
});


app.get("/user", (req, res) => {
  mongo.connect(url, function (err, client) {
    if (err) res.send(err);
          
    const glitch_db = client.db("glitch");
    const coll = glitch_db.collection("exercise-tracker");    
    
    coll.findOne({"userID": req.query.userID}, {fields: {_id:0}}, (err, doc) => {
      if(err) res.send({error: err});
      if(!doc) res.send({error: "User not found"});
      else {res.send(doc); client.close();}
    });            
  });
});

app.get("*", (req, res) => {
  res.status(404).end("Page not found");
})


// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})


