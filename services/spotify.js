const Spotify = require('node-spotify-api');
const diacritics = require('../diacritics')
const Redis = require("ioredis");
const formatBytes = require('./formatBytes')
const redis = new Redis();

var spotify = new Spotify({
  id: process.env.SPOTIFY_API_ID,
  secret: process.env.SPOTIFY_API_SECRET
});

// Fetches Spotify Track meta from cache, then from API.
module.exports.getTrack = async (id) => {
  if (!await redis.exists('track' + id))
    await fetchTrack(id)

  return redis.hgetall('track' + id)
}

// Fetches Track metadata from Spotify API and saves it in redis.
async function fetchTrack(id) {
  var data = await spotify.request('https://api.spotify.com/v1/tracks/' + id)

  // Store in Redis
  await cacheTrackMetadata(data)
}

// Searches for tracks from given string and saves it in redis.
module.exports.search = string => {
  return new Promise((resolve, reject) => {
    Spotify.search({type: 'track', query: string}, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    })
  } 
}

// Stores track metadata in Redis
async function cacheTrackMetadata(track) {
  if (!track) return
  await redis.hset('track' + track.id, {
    id: track.id,
    title: diacritics.removeDiacritics(track.name), // Remove accents that mess things up
    artist: diacritics.removeDiacritics(track.artists[0].name),
    coverUrl: track.album.images[track.album.images.length - 1].url,
    album: diacritics.removeDiacritics(track.album.name)
  })
}

// Searches for Tracks over the Spotify API
module.exports.findTracks = async (string) => {
  var data = await spotify.search({
    type: 'track',
    query: string,
    limit: 5
  })

  tracks = []
  await data.tracks.items.forEach(async (track) => {
    await cacheTrackMetadata(data)

    tracks.push({
      id: track.id,
      title: diacritics.removeDiacritics(track.name),
      artist: diacritics.removeDiacritics(track.artists[0].name),
      coverUrl: track.album.images[track.album.images.length - 1].url
    })
  })


  return tracks
}

// Fetches Playlist metadata from cache then from API
module.exports.getPlaylist = async (id) => {
  if (!await redis.exists('playlist' + id)) {
    // Populate Cache
    var data = await spotify.request('https://api.spotify.com/v1/playlists/' + id)
    var ids = '' // For Redis track id list

    for (i = 0; i < data.tracks.items.length; i++) {
      track = data.tracks.items[i].track
      await cacheTrackMetadata(track)
      ids += track.id + ' '
    }

    await redis.hset('playlist' + id, {
      id: id,
      name: diacritics.removeDiacritics(data.name), // Remove accents that mess things up
      owner: diacritics.removeDiacritics(data.owner.display_name),
      coverUrl: data.images[0].url,
      tracks: ids
    })
  }

  // Read from cache
  var data = await redis.hgetall('playlist' + id)
  let pipeline = redis.pipeline();
  data.tracks.split(' ').forEach((track) => {
    if (track) pipeline.hgetall('track' + track)
  });

  var size = 0
  data.tracks = Array.from(await pipeline.exec(), result => {
    if (result[1].size)
      size += parseInt(result[1].size)
    return result[1]
  }) // Executes pipeline, excluding the error.

  data.size = size
  data.sizeMb = formatBytes(size)
  return data
}

// Removes playlist from cache, can be useful to retrieve updated playlist
module.exports.forgetPlaylist = async (id) => {
  await redis.del('playlist' + id)
}
