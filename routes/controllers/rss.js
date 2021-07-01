const jobs = require('../../services/jobs')
const remove = require('../../services/remove')
const yts = require('yt-search')
const diacritics = require('../../diacritics')

// Adds rss feed info to redis
module.exports.addEpisode = async (redis, feed, videoId) => {
  let video = await yts({
    videoId: videoId
  })
  let title = diacritics.removeDiacritics(video.title)
  let jobId = await jobs.addYoutubeJob(videoId, title)
  await redis.pipeline()
    .hset('episode' + jobId, {
      title: title,
      videoId: videoId,
      author: diacritics.removeDiacritics(video.author.name),
      description: diacritics.removeDiacritics(video.description),
      dateAdded: new Date().toString(),
      jobId: jobId
    }).lpush('feed' + feed, jobId).exec()
    return jobId
}

// Remove rss episode on disk and from feed data on Redis
module.exports.removeEpisode = async (redis, feed, jobId) => {
  await redis.lrem('feed' + feed, 1, jobId)
  await remove.job(redis, jobId)
  return jobId
}

// Fetches rss episode info from redis
module.exports.getFeed = async (redis, feed) => {
  let episodes = await redis.lrange('feed' + feed, 0, 1000)
  let pipeline = redis.pipeline()
  // Fetch episodes
  episodes.forEach(episodeId => {
    if (episodeId) pipeline.hgetall('episode' + episodeId)
  })
  let feed = Array.from(await pipeline.exec(), result => result[1])

  // Fetch job status
  let jobPipeline = redis.pipeline()
  feed.forEach((episode) => {
    jobPipeline.hgetall('job' + episode.jobId)
  });

  (await jobPipeline.exec()).forEach((job, i) => {
    feed[i].job = job
  });

  return feed
}

// Fetches all feeds
module.exports.getAll = async (redis) => {
  let keys = await redis.keys('feed*')

  // Fetch every feed length in one transaction
  let pipeline = redis.pipeline()
  keys.forEach((key) => {
    if (key) pipeline.llen(key)
  })
  let res = await pipeline.exec()
  // Goes through
  var feeds = []
  keys.forEach((key, i) => {
    feeds.push({
      id: key.split('feed')[1],
      episodeNumber: res[i][1]
    })
  })

  return feeds
}
