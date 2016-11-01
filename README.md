# Ogar-servers-manager
Scripts to deal with multiple Ogar servers plus self made daemon like script for servers restarting

### How to use:

Fix paths in start.sh

Fix paths in *.conf files and place them in /etc/init/ 

Reboot and check next:


#### Routes

| URL or PORT      | Description      |
| ------------- |:-------------:|
| /      | Choosing and giving to you server's ip with FFA game mode |
| /teams      | Choosing and giving to you server's ip with teams game mode |
| /experimental      | Choosing and giving to you server's ip with experimental game mode |
| /stats or :81      | Same as port 81, returning back list of all servers in JSON |
| :82    | Show graphical statistic of servers |
| :82/stats    | Returning back statistic's data of server in JSON |

![alt text](https://raw.githubusercontent.com/F0RIS/Ogar-servers-manager/master/list_demo.png "Stats png")


![alt text](https://raw.githubusercontent.com/F0RIS/Ogar-servers-manager/master/stats_demo.png "Stats png")
