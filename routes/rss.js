var express = require('express')
var router = express.Router()
const controller = require('./controllers/rss')
const Podcast = require('podcast')

const BASE_URL = process.env.SPOTYOURMUSIC_BASE_URL

// HTML page with all feeds
router.get('/', async (req, res) => {
  try {
    var feeds = await controller.getAll(req.redis)
    res.render('feeds', {
      title: 'All Feeds',
      feeds: feeds
    })
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

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

// Removes said episode from feed. Redirects to feed page.
router.get('/:id/:jobId/remove', async (req, res) => {
  if (!req.params.id) return res.end('no id???')
  if (!req.body.jobId) return res.end('No job Id')
  try {
    await controller.removeEpisode(req.redis, req.params.id, req.body.jobId)
    res.redirect(`/feed/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// RSS Feed with feed info
router.get('/:id/feed.xml', async (req, res) => {
  if (!/^[a-z0-9]+$/i.test(req.params.id)) // Checks if feed is alphanumerical
    return res.status(400).end('Invalid Id. Alphanumerical please, case-insensitive. Example: Foo7Bar')
  try {
    var episodes = await controller.getFeed(req.redis, req.params.id)
    const feed = new Podcast({
      title: req.params.id,
      description: 'Custom Podcast feed, by spot your music',
      feed_url: `${BASE_URL}/feed/${req.params.id}/feed.xml`,
      site_url: `${BASE_URL}/feed/${req.params.id}/`,
      author: 'SpotYourMusic'
    })

    /* loop over data and add to feed */
    episodes.forEach((episode, i) => {
      feed.addItem({
        title: episode.title,
        description: episode.description,
        url: `${BASE_URL}/tracks/${episode.jobId}.mp3`,
        enclosure: {
          url: `${BASE_URL}/tracks/${episode.jobId}.mp3`
        },
        date: episode.dateAdded
      })
    })

    // TODO cache the xml to send to clients
    const xml = feed.buildXml()
    res.end(xml)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

module.exports = router
