var express = require('express')
var router = express.Router()
const Redis = require("ioredis")
const redis = new Redis()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')

// define the home page route
router.get('/', async function(req, res) {
  res.render('index', {
    title: await redis.get('jobcount'),
    message: 'Hello there!'
  })
})

router.get('/jobs', async (req, res) => {
  var finishedIds = await redis.lrange('finished', 0, 100)
  let pipeline = redis.pipeline();
  finishedIds.forEach((jobId) => {
    if (jobId) pipeline.hgetall('job' + jobId)
  });
  finished = Array.from(await pipeline.exec(), result => result[1])
  res.render('jobs', {
    finished: finished,
    title: 'Jobs'
  })
})

router.get('/jobs/:id', async (req, res) => {
  var job = await redis.hgetall('job' + req.params.id)
  res.render('job', {
    job: job,
    title: 'Job ' + job.jobId
  })
})

router.get('/playlist/:id/', async (req, res) => {
  var playlist = await spotify.getPlaylist(req.params.id)
  res.render('playlist', {
    name: playlist.name,
    title: 'Playlist ' + playlist.name,
    tracks: playlist.tracks
  })
})

router.get('/playlist/:id/queue', async (req, res) => {
  if (!req.params.id) return res.end('no id???')

  await jobs.addSpotifyPlaylistJob(req.params.id)

  res.redirect(`/playlist/${req.params.id}/`)
})

module.exports = router
