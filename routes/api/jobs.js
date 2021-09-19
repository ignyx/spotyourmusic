const express = require('express')
const router = express.Router()
const spotify = require('../../services/spotify')
const jobs = require('../../services/jobs')
const controller = require('./../controllers/jobs')


router.get('/', async (req, res) => {
  const allJobs = await controller.getAll(req.redis)

  res.json({
    finished: allJobs.finished,
    queued: allJobs.queue,
    failed: allJobs.failed,
    latest: allJobs.latest
  })
})

router.get('/:id', async (req, res) => {
  const job = await req.redis.hgetall('job' + req.params.id)
  const track = job.type === 'SpotifyTrack' ? await req.redis.hgetall('track' + job.id) : {}
  res.json({
    job: job,
    title: 'Job ' + job.jobId,
    track: track
  })
})

module.exports = router
