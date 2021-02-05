// Returns a selection of jobs, for display
module.exports.getAll = async (redis) => {
  var jobs = {}

  var finishedIds = await redis.lrange('finished', 0, 100)
  let pipeline = redis.pipeline()
  finishedIds.forEach((jobId) => {
    if (jobId) pipeline.hgetall('job' + jobId)
  });
  jobs.finished = Array.from(await pipeline.exec(), result => result[1])

  return jobs
}
