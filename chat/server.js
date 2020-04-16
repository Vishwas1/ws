const http = require('http')
const express = require('express')
const bodyParser = require('body-parser');
const ws = require('./ws')

const port = 4000
const app = express()
const server = http.createServer(app) //Creating HTTP server using express
ws(server)

const TIME = () => new Date();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'))
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + 'index.html'));
});

server.listen(port, ()=>{
    console.log(`${TIME()} The server is running on port : ${port}`)
})









