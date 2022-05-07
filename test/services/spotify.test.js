const config = require('../../config');
const should = require('should');
const nock = require('nock');
const spotify = require('../../services/spotify.js');
const Redis = require('ioredis');
const redis = new Redis(config.redisPort, { lazyConnect: true });

const testTrack = {
  id: 'TEST',
  name: 'tést title',
  artists: [{name:'test name'}],
  album: {name: 'test album', images: [{url: 'url'}]}
}

const testTrackRedis = {
  id: 'TEST',
  title: 'test title',
  artist: 'test name',
  album: 'test album',
  coverUrl: 'url'
}

before((done) => {
  redis.connect(done);
  // mock token exchange
  nock('https://accounts.spotify.com').post('/api/token').reply(200,{
    access_token: 'token',
    expires_in: 99999
  });
});

after((done) => {
  redis.quit(done);
});

describe('spotify.getTrack', () => {
  it('exists', () => {
    should.exist(spotify.getTrack);
  });

  it('requires a track Id', () => {
    return spotify.getTrack(redis).should.be.rejected();
  });

  it('fetches track from API if track is not in cache', async () => {
    await redis.del('trackTEST');
    nock('https://api.spotify.com').get('/v1/tracks/TEST').reply(200, testTrack);
    const track = await spotify.getTrack(redis, 'TEST');
    nock.isDone().should.be.true();
    await redis.del('trackTEST');
  });

  it('does not fetch from API if track is in cache', async () => {
    await redis.hset('trackTEST', testTrack);
    nock('https://api.spotify.com').get('/v1/tracks/TEST').reply(200, testTrack);
    await spotify.getTrack(redis, 'TEST');
    nock.isDone().should.be.false();
    nock.cleanAll();
  });

  it('fails if API returns an invalid JSON', async () => {
    await redis.del('trackTEST');
    nock('https://api.spotify.com').get('/v1/tracks/TEST').reply(200, {uhh:true});
    await spotify.getTrack(redis, 'TEST').should.be.rejected();
    nock.isDone().should.be.true();
  });

  it('saves the track in redis without diacritics', async () => {
    await redis.del('trackTEST');
    nock('https://api.spotify.com').get('/v1/tracks/TEST').reply(200, testTrack);
    await spotify.getTrack(redis, 'TEST');
    (await redis.hgetall('trackTEST')).should.deepEqual(testTrackRedis);
    await redis.del('trackTEST');
  });
  
  
});

