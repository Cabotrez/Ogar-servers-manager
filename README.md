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
| /\<game mode name\>      | Choosing and giving to you server's ip with selected game mode |
| /stats or :81      | Returning back list of all servers with their params in JSON |
| :82    | Show servers' current players statistic in graphical form |
| :82/stats    | Returning back statistic's data of server in JSON |
| :83   | Show servers' update time statistic in graphical form |
| :83/stats    | Returning back statistic's data of server in JSON (with update time) |

![alt text](https://raw.githubusercontent.com/F0RIS/Ogar-servers-manager/master/list_demo.png "Stats png")


![alt text](https://raw.githubusercontent.com/F0RIS/Ogar-servers-manager/master/stats_demo.png "Stats png")

#License 
GPLv3 https://www.gnu.org/licenses/gpl-3.0.html

     Ogar-server-manager is a nodejs script to manage,get statistics and distribute players over Ogar servers
     Copyright (C) 2016  Zakhariev Anton
     This program is free software; you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation; either version 3 of the License, or
     (at your option) any later version.
     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.
     You should have received a copy of the GNU General Public License
     along with this program; if not, write to the Free Software Foundation,
     Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA

