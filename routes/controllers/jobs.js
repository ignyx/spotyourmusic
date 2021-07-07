// Returns a selection of jobs, for display
module.exports.getAll = async (redis) => {
  var jobs = {}

  var finishedIds = await redis.lrange('finished', 0, 100)
  let pipeline = redis.pipeline()
  finishedIds.forEach((jobId) => {
    if (jobId) pipeline.hgetall('job' + jobId)
  });
  jobs.finished = Array.from(await pipeline.exec(), result => result[1])

  var queuedIds = await redis.lrange('queue', 0, 100)
  let queuePipeline = redis.pipeline()
  queuedIds.forEach((jobId) => {
    if (jobId) queuePipeline.hgetall('job' + jobId)
  });
  jobs.queue = Array.from(await queuePipeline.exec(), result => result[1])

  var failedIds = await redis.lrange('failed', 0, 100)
  let failedPipeline = redis.pipeline()
  failedIds.forEach((jobId) => {
    if (jobId) failedPipeline.hgetall('job' + jobId)
  });
  jobs.failed = Array.from(await failedPipeline.exec(), result => result[1])

  jobs.latest = await redis.get('latest')

  return jobs
}
