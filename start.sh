#!/bin/bash
while true
do
	sh /home/ftpuser/src/Start-linux.sh >> /dev/null &
	pid=$!
	if wait $pid
	then
		echo "It exited successfully"
	else
		message="Nodejs was killed, restarting.."
		echo $message
		echo "$(date +"%d %h %y %R"):  $message" >> /home/log.txt
		sleep 10
	fi
done
