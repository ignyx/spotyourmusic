var express = require('express')
var router = express.Router()
const Redis = require("ioredis")
const redis = new Redis()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const playlistRouter = require('./playlist')
const  jobsRouter = require('./jobs')

// define the home page route
router.get('/', async function(req, res) {
  res.render('index', {
    title: await redis.get('jobcount'),
    message: 'Hello there!'
  })
})

router.use((req, res, next) => {
  req.redis = redis
  next()
})

router.use('/playlist', playlistRouter)
router.use('/jobs', jobsRouter)

module.exports = router
