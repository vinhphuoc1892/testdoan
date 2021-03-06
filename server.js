var bodyParser = require("body-parser");
const express = require("express"); //express framework to have a higher level of methods
const cors = require("cors");
const app = express(); //assign app variable the express class/method
app.use(cors());
const personRoutes = express.Router();

var http = require("http");
var path = require("path");
//mongodb
var MongoClient = require("mongodb").MongoClient;
//var url = "mongodb://localhost:27017/";
const url = "mongodb+srv://kiki:111@cluster0.ewazt.mongodb.net/doan?retryWrites=true&w=majority";
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = http.createServer(app); //create a server
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//***************this snippet gets the local ip of the node.js server. copy this ip to the client side code and add ':3000' *****
//****************exmpl. 192.168.56.1---> var sock =new WebSocket("ws://192.168.56.1:3000");*************************************
require("dns").lookup(require("os").hostname(), function (err, add, fam) {
  console.log("addr: " + add);
});
/**********************websocket setup**************************************************************************************/
//var expressWs = require('express-ws')(app,server);
const WebSocket = require("ws");
const s = new WebSocket.Server({ server });
//when browser sends get request, send html file to browser
// Serve the static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));
// viewed at http://localhost:30000
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});
let dbo;

MongoClient.connect(url, function (err, db) {
  if (err) console.log("err mongo");
  console.log("MongoClient correctly to server");
  dbo = db.db("doan");
});

app.get("/doan", (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  dbo
    .collection("dht11")
    .find({})
    .toArray((error, result) => {
      if (error) {
        return response.status(500).send(error);
      }
      var ob = {
        nhietdo: [result[0].Nhietdo],
        doam: [result[0].Doam],
        as: [result[0].as],
        damkk: [result[0].damkk],
      };
      response.json(ob);
    });
});

/* personRoutes.route('/test').get(function (req, res) {
    console.log(req.body);
	console.log("tsts");
    //person.save()

}); */

app.post("/control", urlencodedParser, (request, response) => {
  // response.header("Access-Control-Allow-Origin", "*");
  // response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  obj = {
    maybom: request.body.maybom || "",
    quat: request.body.quat || "",
    phunsuong: request.body.phunsuong || "",
    chedo: request.body.chedo || "",
    id: request.body.id || "",
  };
  console.log("control data", obj);
  dbo
    .collection("control")
    .updateOne({ id: "2" }, { $set: obj }, function (err, res) {
      if (err) console.log(err);
      console.log("1 document inserted");
    });
  //insert
  /*     dbo.collection("control").insertOne(obj, function(err, res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
	}); */
});
app.get("/control", (request, response) => {
  // response.header("Access-Control-Allow-Origin", "*");
  //response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  obj = {
    maybom: request.body.maybom,
    quat: request.body.quat,
    phunsuong: request.body.phunsuong,
    chedo: request.body.chedo,
    id: request.body.id,
  };
  //console.log("res_body"+response.body);
  dbo.collection("control").findOne({}, function (err, result) {
    if (err) console.log(err);
    response.json(result);
  });
  //end db
  //response.json(request.body)
  //request.send("post");
});
let prevData = "";
//*************************************************************************************************************************
//***************************ws chat server********************************************************************************
//app.ws('/echo', function(ws, req) {
s.on("connection", function (ws, req) {
  /******* when server receives messsage from client trigger function with argument message *****/
  ws.on("message", function (message) {
    //console.log("Received: " + message);
    // mongodb
    if (message) {
      var item = [];
      var myobj = {};
      let myobj11 = {};
      let mynewobj = {};
      let obj1 = {};
      try {
        myobj11 = JSON.parse(message);
        if (myobj11.id == "3") {
          //console.log("control from button ", myobj11);
          obj1 = {
            maybom: myobj11.ctrl_bom || "",
            quat: myobj11.ctrl_quat || "",
            phunsuong: myobj11.ctrl_phunsuong || "",
          };
          console.log("button control", obj1);
          dbo
            .collection("control")
            .updateOne({ id: "2" }, { $set: obj1 }, function (err, res) {
              if (err) console.log(err);
              console.log("1 document inserted");
            });
        }
        mynewobj = {
          Nhietdo: myobj11.Nhietdo || "",
          Doam: myobj11.Doam || "",
          as: myobj11.as || "",
          damkk: myobj11.damkk || "",
        };
        //console.log("obj",myobj11.id);
        var myobjnew = { $set: mynewobj };
        dbo
          .collection("dht11")
          .find({})
          .toArray(function (err, result) {
            if (err) console.log(err);
            //console.log("result ",result);
            item = result.filter((x) => {
              return x.id == 1;
            });
            myobj = { Nhietdo: item[0].Nhietdo, Doam: item[0].Doam };
          });

        dbo
          .collection("dht11")
          .updateMany(myobj, myobjnew, function (err, res) {
            if (err) console.log(err);
            //console.log("1 document inserted");
          });
      } catch (e) {
        console.log("err parse");
      }
      //db
      dbo.collection("control").findOne({}, function (err, result) {
        if (err) console.log(err);
        const resultStr = JSON.stringify(result);
        if (resultStr !== prevData) {
          ws.send(JSON.stringify(result));
          prevData = resultStr;
        }
      });
    }
  });
  console.log("new client connected");
  ws.on("close", function () {
    console.log("lost one client");
  });
});
const port = process.env.PORT || 3000;
server.listen(port);
