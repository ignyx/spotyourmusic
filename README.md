# spotyourmusic
Nodejs app fetching spotify metadata and adding it to youtube mp3s

You'll probably want to `npm i`. You'll need a running redis instance and Spotify API keys.
Also requires `youtube-dl` and `ffmpeg`.

Spotify API credentials should be stored in `SPOTIFY_API_ID` and `SPOTIFY_API_SECRET`.

To use the RSS feed you should specify `SPOTYOURMUSIC_BASE_URL`. Example : `export SPOTYOURMUSIC_BASE_URL=https://example.com`

Also includes shellscripts to start and start a `tmux` session with windows for the redis server, the worker and the webserver. Have a look at `start.sh` and `stop.sh`.

