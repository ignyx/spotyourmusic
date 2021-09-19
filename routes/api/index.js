const express = require('express')
const router = express.Router()
//const playlistRouter = require('./playlist')
const jobsRouter = require('./jobs')
//const trackRouter = require('./track')
//const feedRouter = require('./rss')

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// define the home api page route
router.get('/', async function(req, res) {
  res.json({
    title: await req.redis.get('jobcount'),
    size: await req.redis.get('sizeMb'),
    latestFeed: await req.redis.get('latestFeed'),
    message: 'Hello there!'
  })
})

//router.use('/playlist', playlistRouter)
router.use('/jobs', jobsRouter)
//router.use('/track', trackRouter)
//router.use('/feed', feedRouter)

module.exports = router
