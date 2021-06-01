const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const { v1: uuid } = require("uuid");
const rp = require("request-promise");

const dukatoni = new Blockchain();

//to prevent dashes - split everything and then rejoin
const nodeAddress = uuid().split("-").join("");
console.log(nodeAddress);

// if a request comes in with JSON data or with form data, parse that data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// different ports value to create decentralized network
const port = process.argv[2];

//** ------------------------
//** There will be 3 endpoints in API
//  1. /blockchain -> fetch entire blockchain structure
//  2. /transactions -> creating a new transaction
//  3. /mine -> mining new block by using proofOfWork method
//** ------------------------

app.get("/blockchain", function (req, res) {
  res.send(dukatoni);
});

app.post("/transaction", function (req, res) {
  const blockIndex = dukatoni.createNewTransaction(
    req.body.amount,
    req.body.sender,
    req.body.recipient
  );
  res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});

app.get("/mine", function (req, res) {
  //  to get a blockHash:
  //  1.get the previuous block hash
  //  2.get current block data
  //  3.generate correct nonce from proofOfWork method

  const lastBlock = dukatoni.getLastBlock();
  const previousBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: dukatoni.pendingTransactions,
    index: lastBlock["index"] + 1,
  };
  const nonce = dukatoni.proofOfWork(previousBlockHash, currentBlockData);

  //getting block hash
  const blockHash = dukatoni.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  //everytime someone mines a new block, he gets reward for creating a new block
  // if sender has address '00' -> mining reward
  dukatoni.createNewTransaction(12.5, "00", nodeAddress);

  //creating new block
  const newBlock = dukatoni.createNewBlock(nonce, previousBlockHash, blockHash);

  //response
  res.json({
    note: "New block mined successfully !",
    block: newBlock,
  });
});

//** ------------------------
//** Register a node (on its own server) and broadcast it to whole newtwork
//** ------------------------

app.post("/register-and-broadcast-node", function (req, res) {
  // passing the URL of the node we want to register on the req body
  const newNodeUrl = req.body.newNodeUrl;

  if (dukatoni.networkNodes.indexOf(newNodeUrl) == -1)
    dukatoni.networkNodes.push(newNodeUrl);

  const regNodesPromises = [];
  dukatoni.networkNodes.forEach((networkNodeUrl) => {
    //options that are used for each request
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };
    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises).then((data) => {
    //use data
  });
});

//** ------------------------
//** Register a node with a network
// accepting the new node
//** ------------------------

app.post("/register-node", function (req, res) {});

//** ------------------------
//** Register multiple nodes at once
//** ------------------------

app.post("/register-node-bulk", function (req, res) {});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
