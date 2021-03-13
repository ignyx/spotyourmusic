const express = require('express')
const app = express()
const http = require('http').Server(app)
const router = require('./routes/index')
const bodyParser = require('body-parser')

app.set('view engine', 'pug')

app.use('/', express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/', router)

http.listen(3000, () => {
  console.log('listening on *:3000')
})
