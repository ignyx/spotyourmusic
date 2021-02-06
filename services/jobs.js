const Redis = require("ioredis");
const redis = new Redis();

/**
Adds a Youtube download job to the joblist.

@param {string} [videoId] The target youtube video ID.
@param {string} [title] The title to be added to the metadata.
*/
module.exports.addYoutubeJob = async (videoId, title) => {
  id = await redis.incr('jobcount')
  await redis.pipeline().hset('job' + id, {
    jobId: id,
    type: 'YoutubeTrack',
    videoId: videoId,
    title: title,
    status: 'queued'
  }).rpush('queue', id).exec()
  return id
}

/**
Adds a Spotify Track job to the joblist.

@param {string} trackId The target spotify track ID.
@param {string} [videoId] The target youtube video ID. Will otherwise be fetched.
*/
module.exports.addSpotifyJob = async (trackId, videoId) => {
  id = await redis.incr('jobcount')
  await redis.pipeline().hset('job' + id, {
    jobId: id,
    type: 'SpotifyTrack',
    id: trackId,
    videoId: videoId,
    status: 'queued'
  }).rpush('queue', id).exec()
}

/**
Adds a Spotify Track job for each track of the playlist list.

@param {string} playlistId The target spotify playlist ID.
*/
module.exports.addSpotifyPlaylistJob = async (playlistId) => {
  var playlist = await redis.hgetall('playlist' + playlistId)
  if (!playlist) throw new Error('missing playlist in cache')
  var ids = playlist.tracks.split(' ')

  for(i = 0; i < ids.length; i++)
    if (ids[i])
      await module.exports.addSpotifyJob(ids[i])
}

//module.exports.addSpotifyJob('1moFkZDqcjQNeXtyoanLHv').then(redis.disconnect)
//module.exports.addSpotifyPlaylistJob('6epbO9ZLc79m0NVFz26VLz').then(console.log)
