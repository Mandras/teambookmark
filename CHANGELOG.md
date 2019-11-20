## THE CHANGELOG ##

### 0.9 ###

- use messages handlers to auto-synchronize after an option update
- use messages handlers to auto-synchronize after a main folder rename from website
- after installation, open options page
- little option page re-design

### 0.8 ###

- **Unit tests fix**: avoid useless pings with empty `TeamKey`
- **Unit tests fix**: avoid useless updates with no modifications in root folder
- **Unit tests fix**: now ignoring separators to avoid order issues with FF
- **Unit tests fix**: FF now use auto-generated indexes too
- **Unit tests fix**: offline detection so in this case, resetting local version number
- avoid double synchronization with a protection, usefull in case of update > invalid_version wich may combine with a ping
- now use `api` instead of `ajax` in URL

### 0.7 ###

- once email is validated, the option 'teamkey' is set automatically by browsing the website
- detect when options has changed while processing pings
- new locales: FR
- new logo
- md files updates

### 0.6 ###

- indexes are now auto-generated for chrome / opera
- fix for FF with bookmark order issue
- Opera compatibility, including "Trash" root bookmark compatibility

### 0.5 ###

- rename "Team Bookmark" to "TeamBookmark"

### 0.4 ###

- add PRIVACY.md

### 0.3 ###

- you can now have custom emoji
- folder rename from website is now working
- teamkey delete from website is now working

### 0.2 ###

- cross-browser firefox & chrome
- emoji added at the beginning of the folder name

### 0.1 ###

- first version of the initial project