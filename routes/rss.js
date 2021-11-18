var express = require('express')
var router = express.Router()
const controller = require('./controllers/rss')
const Podcast = require('podcast').Podcast;
const extractChapters = require('get-youtube-chapters');

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

router.all('/:id/*?', (req, res, next) => {
  if (!req.params.id) return res.end('no id???')
  if (!/^[a-z0-9]{1,32}$/i.test(req.params.id)) // Checks if feed is alphanumerical
    return res.status(400).end('Invalid Id. Alphanumerical please, case-insensitive, 1-32 characters. Example: Foo7Bar')
  // Converts numbers to strings, makes them toLowerCase for case-insensitive keys in Redis
  req.feedId = req.params.id.toString().toLowerCase()
  next()
})

// HTML page with feed info
router.get('/:id/', async (req, res) => {
  try {
    var episodes = await controller.getFeed(req.redis, req.feedId)
    req.redis.set('latestFeed', req.feedId)
    res.render('feed', {
      id: req.feedId,
      title: 'Feed ' + req.feedId,
      episodes: episodes
    })
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

const youtubeVideoBaseUrl = 'https://www.youtube.com/watch?v='
const youtubeShareBaseUrl = 'https://youtu.be/'

// Adds said episode. Redirects to feed page.
router.post('/:id/', async (req, res) => {
  if (!req.body.videoId) return res.end('No video Id')
  let videoId = req.body.videoId

  if (videoId.includes(youtubeVideoBaseUrl))
    videoId = videoId.split(youtubeVideoBaseUrl)[1].split('&')[0] // Extracts video Id from url
  else if (videoId.includes(youtubeShareBaseUrl))
    videoId = videoId.split(youtubeShareBaseUrl)[1].split('?')[0] // Extracts video Id from url

  try {
    await controller.addEpisode(req.redis, req.feedId, videoId)
    res.redirect(`/feed/${req.feedId}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// Removes said episode from feed. Redirects to feed page.
router.get('/:id/:jobId/remove', async (req, res) => {
  if (!req.params.jobId) return res.end('No job Id')
  try {
    await controller.removeEpisode(req.redis, req.feedId, req.params.jobId)
    res.redirect(`/feed/${req.feedId}/`)
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed.')
  }
})

// RSS Feed with feed info
router.get('/:id/feed.xml', async (req, res) => {
  try {
    const episodes = await controller.getFeed(req.redis, req.feedId)
    const feed = new Podcast({
      title: req.feedId,
      description: 'Custom Podcast feed, by spot your music',
      feed_url: `${BASE_URL}/feed/${req.feedId}/feed.xml`,
      site_url: `${BASE_URL}/feed/${req.feedId}/`,
      author: 'SpotYourMusic'
    })

    /* loop over data and add to feed */
    episodes.forEach((episode, i) => {
      if (episode.job.status === 'finished') // Exclude failed or queued jobs
        feed.addItem({
          title: episode.title,
          description: episode.description,
          url: `${BASE_URL}/tracks/${episode.jobId}.mp3`,
          enclosure: {
            url: `${BASE_URL}/tracks/${episode.jobId}.mp3`
          },
          date: episode.dateAdded,
          itunesImage: `${BASE_URL}/thumbnails/${episode.jobId}.jpg`,
          pscChapters: {
            version: '1.2',
            chapter: extractChapters(episode.description).map(chapter => {
              chapter.start = secondsToHms(chapter.start);
              return chapter;
            })
	  }
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

secondsToHms = (d) => {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    var hDisplay = h < 10 ? "0" + h : h;
    var mDisplay = m < 10 ? "0" + m : m;
    var sDisplay = s < 10 ? "0" + s : s;
    return hDisplay + ":" + mDisplay + ":" + sDisplay;
}

module.exports = router
