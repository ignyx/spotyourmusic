var express = require('express')
var router = express.Router()
const controller = require('./controllers/rss')

// HTML page with feed info
router.get('/:id/', async (req, res) => {
  if (!/^[a-z0-9]+$/i.test(req.params.id)) // Checks if feed is alphanumerical
    return res.status(400).end('Invalid Id. Alphanumerical please, case-insensitive. Example: Foo7Bar')
  try {
    var episodes = await controller.getFeed(req.redis, req.params.id)
    res.render('feed', {
      id: req.params.id,
      title: 'Feed ' + req.params.id,
      episodes: episodes
    })
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// Adds said episode. Redirects to feed page.
router.post('/:id/', async (req, res) => {
  if (!req.params.id) return res.end('no id???')
  if (!req.body.videoId) return res.end('No video Id')
  try {
    await controller.addEpisode(req.redis, req.params.id, req.body.videoId)
    res.redirect(`/feed/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

module.exports = router
