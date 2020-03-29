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

[https://chrome.google.com/webstore/developer/edit/fdimbcfjbicdaiedpackfiokffllbgie](https://chrome.google.com/webstore/developer/edit/fdimbcfjbicdaiedpackfiokffllbgie)

### Opera ###

[https://addons.opera.com/developer/package/242305/](https://addons.opera.com/developer/package/242305/)


## Unit tests checklist ##

- Option page open automatically after addon installation
- `TeamKey` is set automatically after email validation
- After email validation, if a `TeamKey` already exist, the addon do not overwrite
- The CSS class `has-addon` is well set on `body` of the website
- The main folder is created in toolbar
- Bookmark + folder create/delete/edit is accepted / updated automatically
- Bookmark order change is accepted and updated automatically
- The main folder is well filled and all bookmarks are in orders
- Multiple folders childs/parents work well
- Empty folders still work
- ~~Separator works on FF and cross-browser is well adapted~~
- Main folder move is accepted
- Main folder rename isn't accepted
- Main folder delete lead to recreate
- Another bookmark change do not lead to an update
- Outdated version is not accepted and lead to an update
- Main folder rename from website is updated immediately
- Changes made offline (bookmarks + main folder) are well overwrite once online (without browser restart)
- Not URL link isn't blocking the addon
- `TeamKey` change is working and result to an auto-synchronize
- Invalid or empty `TeamKey` isn't blocking the addon
- Set back the valid `TeamKey` is well understand
- Main folder delete from website is well understood

## Bugs found with previous tests ##

- [x] ~~If the `TeamKey` is empty after an option change, there is useless pings with empty `TeamKey`~~
- [x] ~~Main folder move trigger a useless update~~
- [x] ~~Another bookmark change lead to a useless update~~
- [x] ~~Outdated version is not accepted but do not lead to a sync, anyway it will sync with next ping~~
- [x] ~~Changes made offline (bookmarks + main folder) are not overwrite once online~~
- [x] ~~Order issue found with Firefox again~~
- [ ] Order issue with Firefox still here: [https://bugzilla.mozilla.org/show_bug.cgi?id=1597291](https://bugzilla.mozilla.org/show_bug.cgi?id=1597291)
- [ ] After Browser update, the option page open for no reason
