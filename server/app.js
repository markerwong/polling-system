const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const config = require('config');
const bodyParser = require('body-parser');

let app = express();

const getMongoClient = async () => {
  const mongoConfig = config.get('database.mongodb');
  const url = `mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.dbName}`;
  const mongoClient = await MongoClient.connect(url);
  const collectionItem = mongoClient.collection('records');

  app.use(express.static(path.resolve(__dirname, '..', 'build')));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '..', 'build', 'index.html'));
  });

  app.get('/count', async (req, res) => {
    const countResult = await collectionItem.aggregate([{
      $match: {}
    }, {
      $group: {
        _id: { question: '$question', choice: '$choice' },
        total: {$sum: 1}
      },
    }]).toArray(function(err, docs) {
      res.send(docs);
    });
  });

  app.post('/poll', async (req, res) => {
    const { question, choice } = req.body;
    await collectionItem.insert({
      question,
      choice,
      time: new Date(),
    });

    res.send('123');
  });
};

getMongoClient();

module.exports = app;
