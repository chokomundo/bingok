#!/bin/bash
export PATH="/home/administrator/.local/nodejs/bin:$PATH"
export LD_LIBRARY_PATH="/home/administrator/.local/lib/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# Kill existing bot and chrome
pkill -f "node.*server\.js" 2>/dev/null
pkill -f "chrome.*sessions/session" 2>/dev/null
sleep 2

# Start bot
cd /home/administrator/bingok/server
exec node server.js
