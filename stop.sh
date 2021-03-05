#!/bin/sh

echo "shutdown" | redis-cli

tmux kill-session -t "spotyourmusic"
