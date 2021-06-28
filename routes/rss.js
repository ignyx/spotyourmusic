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

router.all('/:id/*', (req, res) => {
  if (!req.params.id) return res.end('no id???')
  if (!/^[a-z0-9]{1,32}$/i.test(req.params.id)) // Checks if feed is alphanumerical
    return res.status(400).end('Invalid Id. Alphanumerical please, case-insensitive, 1-32 characters. Example: Foo7Bar')
  // Converts numbers to strings, makes them toLowerCase for case-insensitive keys in Redis
  req.params.id = req.params.id.toString().toLowerCase()
})

// HTML page with feed info
router.get('/:id/', async (req, res) => {
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

const youtubeVideoBaseUrl = 'https://www.youtube.com/watch?v='

// Adds said episode. Redirects to feed page.
router.post('/:id/', async (req, res) => {
  if (!req.body.videoId) return res.end('No video Id')
  let videoId = req.body.videoId

  if (videoId.includes(youtubeVideoBaseUrl))
     videoId = videoId.split(youtubeVideoBaseUrl)[1].split('&')[0] // Extracts video Id from url

  try {
    await controller.addEpisode(req.redis, req.params.id, videoId)
    res.redirect(`/feed/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// Removes said episode from feed. Redirects to feed page.
router.get('/:id/:jobId/remove', async (req, res) => {
  if (!req.params.jobId) return res.end('No job Id')
  try {
    await controller.removeEpisode(req.redis, req.params.id, req.params.jobId)
    res.redirect(`/feed/${req.params.id}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// RSS Feed with feed info
router.get('/:id/feed.xml', async (req, res) => {
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
