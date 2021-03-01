// Fetches all playlist info
module.exports.getAll = async (redis) => {
  let keys = await redis.keys('playlist*')

  // Fetch every playlist metadata in one transaction
  let pipeline = redis.pipeline()
  keys.forEach((key) => {
    if (key) pipeline.hgetall(key)
  });
  return Array.from(await pipeline.exec(), result => result[1])
}
