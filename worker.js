const Redis = require("ioredis");
const ffmetadata = require("ffmetadata");
const youtube = require('yt-search');
const fs = require('fs');
const https = require('https');
const redis = new Redis();
const {
  exec
} = require("child_process");

// If 'active' is true, worker is working or has crashed.
// 'current' is the current job number.

/*async function start() {
  if (await redis.get('active')) {
    console.log('Worker was active')
    var job = await redis.get('current')
    console.log('Trying to fix job ' + job)
  }
}*/

// Finds the next queued job and figures it out
async function dealWithNextJob() {
  if (await redis.llen('queue') !== 0) { // Check if jobs available
    await redis.set('active', true)
    var jobId = await redis.lpop('queue')

    var job = await redis.hgetall('job' + jobId)

    if (!job) {
      console.log('-- FAILED TO FIND QUEUED JOB ' + jobId)
    } else {
      await redis.pipeline()
        .hset('job' + jobId, 'status', 'working')
        .set('latest', jobId)
        .exec()

      try {
        switch (job.type) {
          case 'SpotifyTrack':
            await spotifyJob(jobId, job.id, job.videoId)
            break
          case 'YoutubeTrack':
            await youtubeJob(jobId, job.videoId, job.title)
            break
          default:
            throw new Error('Invalid job type')
        }
        await redis.pipeline()
          .hset('job' + jobId, 'status', 'finished')
          .lpush('finished', jobId)
          .exec()

      } catch (err) {
        console.log('-- FAILED job ' + jobId)
        console.log(err)
        await redis.pipeline()
          .hset('job' + jobId, 'status', 'failed')
          .lpush('failed', jobId)
          .exec()
        console.log('removing file for job ' + jobId)
        fs.unlinkSync(`${__dirname}/public/tracks/${jobId}.mp3`)
      }
    }
  }
  await redis.set('active', false)
  return await new Promise((resolve) => {
    setTimeout(resolve, 1000)
  }) // wait 1 sec
}

// Deals with a youtube job, downloading and converting the video using youtube-dl
async function youtubeJob(jobId, id, title) {
  await youtubeDownload(jobId, id)
  await new Promise((resolve, reject) => {
    console.log('Writing metadata for job ' + jobId);
    ffmetadata.write(`${__dirname}/public/tracks/${jobId}.mp3`, {
      title: title
    }, function(err) {
      if (err) {
        console.error("Error writing metadata for job " + jobId);
        return reject()
      } else {
        console.log("metadata added for job " + jobId);
        resolve()
      }
    });
  })
  console.log("-- Finished job " + jobId)
}

function youtubeDownload(jobId, id) {
  return new Promise((resolve, reject) => {
    console.log('-- Attemping youtube-dl for job ' + jobId)
    exec(`youtube-dl -o './public/tracks/${jobId}.%(ext)s' -x --audio-format mp3 --audio-quality 1 "https://www.youtube.com/watch?v=${id}"`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error for job ${jobId}: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr for job ${jobId}: ${stderr}`);
        return reject(error);
      }
      console.log(`stdout for job ${jobId}: ${stdout}`);
      console.log('-- Success w youtube-dl for job ' + jobId)
      resolve()
    });
  })
}

async function spotifyJob(jobId, trackId, videoId) {
  console.log(`-- Spotify job ${jobId} with track ${trackId}`)
  var meta = await redis.hgetall('track' + trackId)
  if (!meta) throw new Error('No metadata')

  if (meta.available) return console.log('-- Track already available for job ' + jobId)

  console.log('Fetching cover image for job ' + jobId)
  // Retrieve cover image
  var coverImage = `${__dirname}/public/tracks/${jobId}`
  await new Promise((resolve, reject) => {
    let file = fs.createWriteStream(coverImage);
    const request = https.get(meta.coverUrl, function(response) {
      console.log(meta.coverUrl)
      response.pipe(file);
      file.on('finish', function() {
        file.close(); // close() is async
        resolve()
      });
    });
  })

  if (!videoId) {
    console.log('Fetching video ID for job ' + jobId)
    result = await youtube(meta.artist + meta.title)
    videoId = result.videos[0].videoId
  }

  await youtubeDownload(jobId, videoId)

  // Add metadata
  await new Promise((resolve, reject) => {
    console.log('Writing metadata for job ' + jobId);
    ffmetadata.write(`${__dirname}/public/tracks/${jobId}.mp3`, {
      title: meta.title,
      artist: meta.artist,
      album: meta.album
    }, {
      attachments: [coverImage], // Cover
    }, function(err) {
      if (err) {
        console.error("Error writing metadata for job " + jobId);
        return reject(err)
      } else {
        console.log("metadata added for job " + jobId);
        resolve()
      }
    });
  })
  console.log('removing cover for job ' + jobId)
  fs.unlinkSync(coverImage)
  console.log('-- Successfully delt with job ' + jobId)
  await redis.hset('track' + trackId, 'available', true, 'job', jobId)
}

// works until redis tells it not to
async function work() {
  while (!await redis.get('stop'))
    await dealWithNextJob()
  await redis.set('stop', false)
  redis.quit()
}

work()
//spotifyJob(45, '1moFkZDqcjQNeXtyoanLHv').catch(console.log)
//youtube('lalala').then(console.log)
