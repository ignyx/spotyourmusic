var express = require('express')
var router = express.Router()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const controller = require('./controllers/jobs')


router.get('/', async (req, res) => {
  var allJobs = await controller.getAll(req.redis)

  res.render('jobs', {
    finished: allJobs.finished,
    title: 'Jobs'
  })
})

router.get('/:id', async (req, res) => {
  var job = await req.redis.hgetall('job' + req.params.id)
  res.render('job', {
    job: job,
    title: 'Job ' + job.jobId
  })
})

module.exports = router
