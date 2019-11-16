# MAINTENANCE #

## Browsers addon-dev URL ##

### Firefox ###

[about:debugging](about:debugging)

### Google Chrome ###

[chrome://extensions](chrome://extensions)

### Opera ###

[opera:extensions](opera:extensions)


## Addon dashboards ##

### Firefox ###

[https://addons.mozilla.org/fr/developers/addon/teambookmark/edit](https://addons.mozilla.org/fr/developers/addon/teambookmark/edit)

### Google Chrome ###

[https://chrome.google.com/webstore/developer/dashboard](https://chrome.google.com/webstore/developer/dashboard)

### Opera ###

[https://addons.opera.com/developer/package/242305/](https://addons.opera.com/developer/package/242305/)


## Unit tests checklist ##

- `TeamKey` is set automatically after email validation
- After email validation, if a `TeamKey` already exist, the addon do not overwrite
- The CSS class `has-addon` is well set on `body` of the website
- The main folder is created in toolbar
- Bookmark + folder create/delete is accepted / updated automatically
- Bookmark order change is accepted and updated automatically
- The main folder is well filled and all bookmarks are in orders
- Multiple folders childs/parents work well
- Empty folders still work
- Separator works on FF and cross-browser is well adapted
- Main folder move is accepted
- Main folder rename isn't accepted
- Main folder delete lead to recreate
- Another bookmark change do not lead to an update
- Outdated version is not accepted and lead to an update
- Main folder rename from website is updated automatically
- Changes made offline (bookmarks + main folder) are well overwrite once online (without browser restart)
- Not URL link isn't blocking the addon
- `TeamKey` change is working
- Invalid or empty `TeamKey` isn't blocking the addon
- Set back the valid `TeamKey` is well understand
- Main folder delete from website is well understood

## Issues found with previous tests ##

- ~~If the `TeamKey` is empty after an option change, there is pings with empty `TeamKey`~~
- Main folder move trigger an update
- Another bookmark change lead to an update
- Outdated version is not accepted but do not lead to a sync, anyway it will sync with next ping
- Changes made offline (bookmarks + main folder) are not overwrite once online
- Order issue found with Mozilla
