const {
  unlink
} = require('fs/promises');

// Remove file corresponding to given job and marks in redis as deleted
module.exports.job = async (redis, id) => {
  await unlink(`${process.cwd()}/public/tracks/${id}.mp3`)
  await redis.hset('job' + id, 'status', 'deleted')
  console.log('Removed file for job ' + id)
}

// Remove track from disk and mark as unavailable
module.exports.track = async (redis, id) => {
  let jobId = await redis.hget('track' + id, 'job')
  await module.exports.job(redis, jobId)
  await redis.hset('track' + id, 'available', false)
  return jobId
}

// Remove playlist tracks from disk and mark as unavailable.
module.exports.playlist = async (redis, id) => {
  console.log('Removing playlist ' + id)
  let tracks = (await redis.hget('playlist' + id, 'tracks')).split(' ')
  var issues = false
  for (i = 0; i < tracks.length; i++) {
    var track = tracks[i]
    if (track)
      try {
        await module.exports.track(redis, track)
      } catch (err) {
        console.log(`Failed to remove track ${track} : ${err}`)
        issues = true
      }
  }
  if (issues) console.log('Encountered issues while removing playlist ' + id)
  else console.log('Successfully removed playlist ' + id)
}
