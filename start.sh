#!/bin/sh

echo "Stopping previous session"
sh stop.sh > /dev/null

mkdir -p data 								 # Creates data folder, if it doesn't exist
mkdir -p public/tracks
mkdir -p public/thumbnails

# Starts a tmux session named "spotyourmusic" and detaches
# Starts Redis instance, worker and webserver
# (DISABLED) Evenly distributes the window sizes, vertically

echo "Starting new session"
tmux \
  new-session -d -s "spotyourmusic" \
  "cd data && redis-server ; read" \; \
  split-window "node worker.js ; read" \; \
  split-window ". ~/.profile && npm run prod ; read" \; \
  #select-layout even-vertical
