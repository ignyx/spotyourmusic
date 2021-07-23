# spotyourmusic
Nodejs app fetching spotify metadata and adding it to youtube mp3s.
Intended for personal use.

You'll probably want to `npm i`. You'll need a running redis instance and Spotify API keys.
Also requires `youtube-dl` and `ffmpeg`.

Spotify API credentials should be stored in `SPOTIFY_API_ID` and `SPOTIFY_API_SECRET`.

To use the RSS feed you should specify `SPOTYOURMUSIC_BASE_URL`. Example : `export SPOTYOURMUSIC_BASE_URL=https://example.com`

Also includes shellscripts to start and start a `tmux` session with windows for the redis server, the worker and the webserver. Have a look at `start.sh` and `stop.sh`.
You can then use `tmux a -t spotyourmusic` to monitor the session.

## License
MIT License

Copyright (c) 2021 Paul ALNET <paul@shimaore.net>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
