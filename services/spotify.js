const Spotify = require('node-spotify-api');
const diacritics = require('../diacritics');
const formatBytes = require('./formatBytes');
const config = require('../config');

const spotify = new Spotify({
  id: config.spotifyApiId,
  secret: config.spotifyApiSecret
});

// Fetches Spotify Track meta from cache, then from API.
module.exports.getTrack = async (redis, id) => {
  if (!id) throw new Error('Missing track id');
  if (!await redis.exists('track' + id))
    await fetchTrack(redis, id);
  return redis.hgetall('track' + id);
}

// Fetches Track metadata from Spotify API and saves it in redis.
async function fetchTrack(redis, id) {
  const data = await spotify.request('https://api.spotify.com/v1/tracks/' + id);
  // Store in Redis
  await cacheTrackMetadata(redis, data);
}

// Stores track metadata in Redis
async function cacheTrackMetadata(redis, track) {
  if (!track) throw new Error('No track provided');
  await redis.hset('track' + track.id, {
    id: track.id,
    title: diacritics.removeDiacritics(track.name), // Remove accents that mess things up
    artist: diacritics.removeDiacritics(track.artists[0].name),
    coverUrl: track.album.images[track.album.images.length - 1].url,
    album: diacritics.removeDiacritics(track.album.name)
  });
}

// Searches for Tracks over the Spotify API
module.exports.findTracks = async (redis, string) => {
  const data = await spotify.search({
    type: 'track',
    query: string,
    limit: 5
  });
  const tracks = [];
  let track;
  for (i=0; i < data.tracks.items.length; i++) {
    track = data.tracks.items[i];
    await cacheTrackMetadata(redis, track);
    tracks.push({
      id: track.id,
      title: diacritics.removeDiacritics(track.name),
      artist: diacritics.removeDiacritics(track.artists[0].name),
      coverUrl: track.album.images[track.album.images.length - 1].url
    });
  }
  return tracks;
}

// Fetches playlist data from Spotify API and stores in Redis
async function cachePlaylist(redis, id) {
  const data = await spotify.request('https://api.spotify.com/v1/playlists/' + id);
  let ids = ''; // For Redis track id list
  for (i = 0; i < data.tracks.items.length; i++) {
    const track = data.tracks.items[i].track;
    if (track)
      await cacheTrackMetadata(track);
    ids += track.id + ' ';
  }
  await redis.hset('playlist' + id, {
    id: id,
    name: diacritics.removeDiacritics(data.name), // Remove accents that mess things up
    owner: diacritics.removeDiacritics(data.owner.display_name),
    coverUrl: data.images[0].url,
    tracks: ids
  });
}

// Fetches Playlist metadata from cache then from API
module.exports.getPlaylist = async (redis, id) => {
  if (!await redis.exists('playlist' + id))
    await cachePlaylist(redis, id);
  // Read from cache
  const data = await redis.hgetall('playlist' + id);
  let pipeline = redis.pipeline();
  data.tracks.split(' ').forEach((trackId) => {
    if (trackId) pipeline.hgetall('track' + trackId);
  });
  let size = 0;
  data.tracks = Array.from(await pipeline.exec(), result => {
    if (result[1].size)
      size += parseInt(result[1].size);
    return result[1]
  }); // Executes pipeline, excluding the error.
  data.size = size;
  data.sizeMb = formatBytes(size);
  return data;
}

// Removes playlist from cache, can be useful to retrieve updated playlist
module.exports.forgetPlaylist = async (redis, id) => {
  await redis.del('playlist' + id)
}
