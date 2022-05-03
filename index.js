const express = require('express')
const app = express()
const http = require('http').Server(app)
const router = require('./routes/index')
const bodyParser = require('body-parser')
const config = require('./config');

app.set('view engine', 'pug')

app.use('/', express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', router)

http.listen(config.port, () => {
  console.log('listening on *:' + config.port);
})
