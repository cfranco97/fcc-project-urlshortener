require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {MongoClient} = require('mongodb');
const dns = require('dns');
const urlparser = require('url');



// Basic Configuration
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

// connection
const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true }) 
const db = client.db('urlShortenerDB');
const collection = db.collection('urlmappings');



app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Handle shorturl post request
app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err,address) => {
    if (!address){
      // display error on page.
      res.json({error: 'invalid url'})
    } else {
      // if url is legit, its time to save inside our db.
      const urlCount = await collection.countDocuments({});
      // create a new document.
      const urlDoc = {
        original_url: url,
        short_url: urlCount
      }

      const result = await collection.insertOne(urlDoc);
      console.log(result)
      // display successful creation on page.
      res.json(urlDoc)
    }
  });
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const shorturl = req.params.short_url;
  // find doc from db
  const urlDoc = await collection.findOne({short_url: +shorturl})
  if (urlDoc){
    console.log(`Redirecting user to: ${urlDoc.original_url}`)
    res.redirect(urlDoc.original_url);
  }else {
    console.log(`User attempted to find an URL that does not exist: ${shorturl}`)
    res.status(404).json({error: "URL not found."});
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
