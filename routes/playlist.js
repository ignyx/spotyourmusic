var express = require('express')
var router = express.Router()
const spotify = require('../services/spotify')
const jobs = require('../services/jobs')
const controller = require('./controllers/playlist')

// HTML page with playlist info
router.get('/:id/', async (req, res) => {
  try {
    var playlist = await spotify.getPlaylist(req.params.id)
    res.render('playlist', {
      id: req.params.id,
      name: playlist.name,
      title: 'Playlist ' + playlist.name,
      tracks: playlist.tracks
    })
  } catch (err) {
    console.log(err)
    res.status(500).end('Failed. May be an invalid ID')
  }
})

router.get('/', async (req, res) => {
  try {
    let playlists = await controller.getAll(req.redis)
    res.render('playlists', {
      title: 'All seen playlists',
      playlists: playlists
    })
  } catch (err) {
    console.log(err)
    res.status(500).end('Server-side error')
  }
})

// Queues said playlist. Redirects to playlist page.
router.get('/:id/queue', async (req, res) => {
  if (!req.params.id) return res.end('no id???')

  await jobs.addSpotifyPlaylistJob(req.params.id)

  res.redirect(`/playlist/${req.params.id}/`)
})

module.exports = router
