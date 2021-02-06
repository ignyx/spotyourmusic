const jobs = require('../../services/jobs')
const yts = require('yt-search')
const diacritics = require('../diacritics')

// Adds rss feed info to redis
module.exports.addEpisode = async (redis, videoId) => {
  let video = await yts({
    videoId: videoId
  })
  let title = diacritics.removeDiacritics(video.title)
  let jobId = await jobs.addYoutubeJob(videoId, title)
  await redis.pipeline()
    .hset('episode' + jobId, {
      title: title,
      videoId: videoId,
      
    })
}
