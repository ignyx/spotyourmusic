var express = require('express')
var router = express.Router()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const remove = require('../services/remove')

// HTML page with track info
router.get('/:id/', async (req, res) => {
  try {
    var track = await spotify.getTrack(req.params.id)
    res.render('track', track)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed. May be an invalid ID')
  }
})

// Queues said track. Redirects to track page.
router.get('/:id/queue', async (req, res) => {
  if (!req.params.id) return res.end('no id???')

  await jobs.addSpotifyJob(req.params.id)

  res.redirect(`/track/${req.params.id}/`)
})

router.get('/:id/remove', async (req, res) => {
  if (!req.params.id) return res.end('no id???')

  try {
    await remove.track(req.redis, req.params.id)
    res.redirect(`/track/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed. May be an invalid ID')
  }
})

module.exports = router
