const config = {
  development: {
    port: 4000,
    redisPort: 6379,
    baseUrl: process.env.SPOTYOURMUSIC_BASE_URL,
    spotifyApiId: process.env.SPOTIFY_API_ID,
    spotifyApiSecret: process.env.SPOTIFY_API_SECRET
  },
  production: {
    port: 3000,
    redisPort: 6379,
    baseUrl: process.env.SPOTYOURMUSIC_BASE_URL,
    spotifyApiId: process.env.SPOTIFY_API_ID,
    spotifyApiSecret: process.env.SPOTIFY_API_SECRET
  },
  test: {
    port: 3000,
    redisPort: 6379,
    baseUrl: "localhost",
    spotifyApiId: "id",
    spotifyApiSecret: "secret"
  }
};

module.exports = config[process.env.NODE_ENV];
