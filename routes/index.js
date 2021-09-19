var express = require('express')
var router = express.Router()
const Redis = require("ioredis")
const redis = new Redis()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const playlistRouter = require('./playlist')
const jobsRouter = require('./jobs')
const trackRouter = require('./track')
const feedRouter = require('./rss')
const apiRouter = require('./api/index')

// define the home page route
router.get('/', async function(req, res) {
  res.render('index', {
    title: await redis.get('jobcount'),
    size: await redis.get('sizeMb'),
    latestFeed: await redis.get('latestFeed'),
    message: 'Hello there!'
  })
})

router.use((req, res, next) => {
  req.redis = redis
  next()
})

router.use('/playlist', playlistRouter)
router.use('/jobs', jobsRouter)
router.use('/track', trackRouter)
router.use('/feed', feedRouter)
router.use('/api', apiRouter)

const spotifyPlaylistBaseUrl = 'https://open.spotify.com/playlist/'

router.get('/spotify', (req, res) => {
  if (req.query.url.includes(spotifyPlaylistBaseUrl))
    res.redirect('/playlist/' + req.query.url.split(spotifyPlaylistBaseUrl)[1])
  else res.status(400).end('Unable to locate type and id')
})

module.exports = router
