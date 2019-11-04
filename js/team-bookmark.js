var domain = "https://www.teambookmark.org";
var root_id = '';
var main_id = '';
var folder_name;
var version = 0;
var options;

// DO PING

function ping() {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', domain + '/ajax/ping.php?key=' + options.key + '&version=' + version + '&ts=' + new Date().getTime(), true);
	xhr.responseType = 'json';

	xhr.onload = function() {
		if (xhr.status === 200) {

			var obj = xhr.response;

			if (obj.version > 0 && obj.version > version) {
				synchronize();
			}
		}
	};
	xhr.send();
}

// TRIGGER A CHANGE, UPDATE CLOUD DATAS

function update_on_cloud() {
	var get = browser.bookmarks.getSubTree(main_id);
	get.then(function(node) {

		if (node[0].title != folder_name) {
			var updating = browser.bookmarks.update(node[0].id, {
				title: folder_name
			});
			updating.then(function() { }, function() { });
		}

		var json = JSON.stringify(node[0].children);

		var data = new FormData();
		data.append('key', options.key);
		data.append('version', version);
		data.append('json', json);

		var xhr = new XMLHttpRequest();
		xhr.open('POST', domain + '/ajax/update.php?ts=' + new Date().getTime(), true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			if (xhr.status === 200) {

				var obj = xhr.response;

				console.log(obj);

				if (obj.action == "update_version" && obj.version > 0) {
					version = obj.version;
				}
			}
		};
		xhr.send(data);

	}, function() { console.error("team-bookmark - can not find the team folder, have you delete it ? ... how dare you ?"); });
}

// WE DO THE CHANGES IN BOOKMARKS

function compare_bookmark(system_tree, tb_tree) {

	if (main_id.length > 0) {

		var get = browser.bookmarks.getSubTree(system_tree.id);
		get.then(function(node) {
			for (var i = 0; i < node[0].children.length; i++) {
				if (node[0].children[i].type == "folder") {
					var removing = browser.bookmarks.removeTree(node[0].children[i].id);
	    			removing.then(function() { }, function() { });
				}
				else {
					var removing = browser.bookmarks.remove(node[0].children[i].id);
					removing.then(function() { });
				}
			}

			setTimeout(function() {
				for (var i = 0; i < tb_tree.length; i++) {
					// -- BOOKMARK
					if (tb_tree[i].url != null) {
						var creation = browser.bookmarks.create({
							parentId: system_tree.id,
							title: tb_tree[i].title,
							url: tb_tree[i].url,
							index: i
						});
						creation.then(function(node) { });
					}
					// -- FOLDER
					else if (tb_tree[i].title != null && tb_tree[i].title.length > 0) {
						var creation = browser.bookmarks.create({
							parentId: system_tree.id,
							title: tb_tree[i].title,
							index: i
						});
						var tb_newtree = tb_tree[i].bookmarks;
						creation.then(function(node) {
							compare_bookmark(node, tb_newtree);
						});
					}
					// -- SEPARATOR
					else {
						var creation = browser.bookmarks.create({
							parentId: system_tree.id,
							type: "separator",
							title: '',
							url: '',
							index: i
						});
						creation.then(function(node) { });
					}
				}
			}, 50);
		}, function() { });
	}
}

// FULL SYNCHRONIZE

function synchronize() {

	// get options

	var storage = browser.storage.local.get("options");

	storage.then(function(item) {
		if (typeof item.options !== "undefined" && typeof item.options.key !== "undefined") {
			options = {
				key: item.options.key
			};

			if (options.key.length > 0) {

				console.info("team-bookmark: launch synchronize");

				// Get JSON content

				var xhr = new XMLHttpRequest();
				xhr.open('GET', domain + '/ajax/synchronize.php?key=' + options.key + '&ts=' + new Date().getTime(), true);
				xhr.responseType = 'json';

				xhr.onload = function() {
					if (xhr.status === 200) {

						var obj = xhr.response;

						if (obj.app.name == "team-bookmark" && typeof obj.folder_name != "undefined" && obj.folder_name.length > 0) {

							folder_name = obj.folder_name;

							version = obj.meta.version;

							// Because we override all bookmarks, we remove binds

							if (browser.bookmarks.onCreated.hasListener(update_on_cloud)) { browser.bookmarks.onCreated.removeListener(update_on_cloud); }
							if (browser.bookmarks.onRemoved.hasListener(update_on_cloud)) { browser.bookmarks.onRemoved.removeListener(update_on_cloud); }
							if (browser.bookmarks.onChanged.hasListener(update_on_cloud)) { browser.bookmarks.onChanged.removeListener(update_on_cloud); }
							if (browser.bookmarks.onMoved.hasListener(update_on_cloud)) { browser.bookmarks.onMoved.removeListener(update_on_cloud); }

							// Let's search for the folder

							var searching = browser.bookmarks.search({ title: folder_name });
							searching.then(function(items) {
								if (items.length > 1) {
									for (var i = 0; i < items.length; i++) {
										var removing = browser.bookmarks.removeTree(items[i].id);
			    						removing.then(function() { }, function() { });
									}
								}
								
								if (items.length != 1 && root_id.length > 0) {
									var creation = browser.bookmarks.create({
										parentId: root_id,
										title: folder_name,
										index: 0
									});
									creation.then(function(node) {
										console.info("team-bookmark: create root for toolbar");
										main_id = node.id;
										compare_bookmark(node, obj.bookmarks);
									});
								}
								else if (items.length == 1) {
									main_id = items[0].id;
									compare_bookmark(items[0], obj.bookmarks);
								}

								setTimeout(function() {
									browser.bookmarks.onCreated.addListener(update_on_cloud);
									browser.bookmarks.onRemoved.addListener(update_on_cloud);
									browser.bookmarks.onChanged.addListener(update_on_cloud);
									browser.bookmarks.onMoved.addListener(update_on_cloud);
								}, 1500);

							}, function() { });
						}
					}
					else {
						console.error("team-bookmark: could not synchronize, XHR responses KO");
					}
				};
				xhr.send();
			}
			else { console.error("team-bookmark: no key defined."); }
		}
		else { console.error("team-bookmark: options missmatch datas."); }
	},
	function() {
		console.error("team-bookmark: no options found.");
	});
}

console.info("team-bookmark: starting");

// STARTUP

// search for default root_id

var tree = browser.bookmarks.getTree();
tree.then(function(items) {
	for (var i = 0; i < items[0].children.length; i++) {
		if (items[0].children[i].id.startsWith('toolbar_')) {
			root_id = items[0].children[i].id;
		}
	}
});

// we set the new menus for FF only (unused)

if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
	browser.menus.create({
		id: "tb-main",
		type: "checkbox",
		title: browser.i18n.getMessage("menuUseThisFolder"),
		contexts: ["bookmark"],
		enabled: false,
		checked: false
	}, function() { });

	browser.menus.onShown.addListener(async function(info, tab) {
		if (typeof info.bookmarkId != "undefined" && info.bookmarkId.length > 0) {
			var get = browser.bookmarks.getSubTree(info.bookmarkId);
			get.then(function(node) {

				if (main_id.length > 0 && node[0].id == main_id) {
					var checked = true;
				}
				else { var checked = false; }

				if (main_id.length == 0 && node[0].type == "folder" && node[0].children.length == 0) {
					var updating = browser.menus.update("tb-main", {
						checked: checked,
						enabled: false
					});
					updating.then(function() { browser.menus.refresh(); }, function() { });
				}
				else {
					var updating = browser.menus.update("tb-main", {
						checked: checked,
						enabled: false
					});
					updating.then(function() { browser.menus.refresh(); }, function() { });
				}
			});
		}
	});
}

// launch auto synch

setInterval(function () {
	ping();
}, 60000);

synchronize();
