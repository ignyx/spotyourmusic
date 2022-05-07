const express = require('express');
const router = express.Router();
const spotify = require('../services/spotify');
const jobs = require('../services/jobs');
const remove = require('../services/remove');

// HTML page with track info
router.get('/:id/', async (req, res) => {
  try {
    const track = await spotify.getTrack(req.redis, req.params.id);
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

// Removes said track. Redirects to track page.
router.get('/:id/remove', async (req, res) => {
  if (!req.params.id) return res.end('no id???')

  try {
    await remove.track(req.redis, req.params.id)
    res.redirect(req.query.redirect ? req.query.redirect : `/track/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed. May be an invalid ID')
  }
})

module.exports = router
