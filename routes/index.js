const config = require('../config');
const express = require('express');
const router = express.Router();
const Redis = require("ioredis")
const redis = new Redis(config.redisPort);
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const playlistRouter = require('./playlist')
const jobsRouter = require('./jobs')
const trackRouter = require('./track')
const feedRouter = require('./rss')

// define the home page route
router.get('/', async function(req, res) {
  res.render('index', {
    title: await redis.get('jobcount'),
    size: await redis.get('sizeMb'),
    latestFeed: await redis.get('latestFeed'),
    message: 'Hello there!'
  })
})

// Share Redis instance among requests
router.use((req, res, next) => {
  req.redis = redis
  next()
})

router.use('/playlist', playlistRouter)
router.use('/jobs', jobsRouter)
router.use('/track', trackRouter)
router.use('/feed', feedRouter)

const spotifyPlaylistBaseUrl = 'https://open.spotify.com/playlist/'

router.get('/spotify', (req, res) => {
  if (req.query.url.includes(spotifyPlaylistBaseUrl))
    res.redirect('/playlist/' + req.query.url.split(spotifyPlaylistBaseUrl)[1])
  else res.status(400).end('Unable to locate type and id')
})

router.get('/search', async (req, res) => {
  if (!req.query.q || (req.query.q.toString().length > 32))
    res.redirect('/');
  else res.render('search', {
    title: 'Search ' + req.query.q,
    tracks: await spotify.findTracks(req.redis, req.query.q)
  })
});

module.exports = router
