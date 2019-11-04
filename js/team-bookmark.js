var domain = "https://www.teambookmark.org";
var folder_name_pre = "✔️ ";
var empty_tbtree_issu = [];
var is_chrome = false;
var root_id = '';
var main_id = '';
var folder_name;
var version = 0;
var options;

function ff_error(error) { console.error(`${error}`); }

// sub-function => synchronize_folder_found
function synchronize_folder_found(items) {
	if (items.length > 1) {
		for (var i = 0; i < items.length; i++) {
			if (is_chrome) {
				browser.bookmarks.removeTree(items[i].id);
			}
			else {
				var removing = browser.bookmarks.removeTree(items[i].id);
				removing.then(function() { }, ff_error);
			}
		}
	}

	if (items.length != 1 && root_id.length > 0) {
		if (is_chrome) {
			browser.bookmarks.create({
				parentId: root_id,
				title: folder_name_pre + folder_name,
				index: 0
			}, function(node) {
				console.info("team-bookmark: create root for toolbar");
				main_id = node.id;
				compare_bookmark(node, this.bookmark);
			});
		}
		else {
			var creation = browser.bookmarks.create({
				parentId: root_id,
				title: folder_name_pre + folder_name,
				index: 0
			});
			creation.then(function(node) {
				console.info("team-bookmark: create root for toolbar");
				main_id = node.id;
				compare_bookmark(node, this.bookmark);
			});
		}		
	}
	else if (items.length == 1) {
		main_id = items[0].id;
		compare_bookmark(items[0], this.bookmark);
	}

	setTimeout(function() {
		browser.bookmarks.onCreated.addListener(update_on_cloud);
		browser.bookmarks.onRemoved.addListener(update_on_cloud);
		browser.bookmarks.onChanged.addListener(update_on_cloud);
		browser.bookmarks.onMoved.addListener(update_on_cloud);
	}, 1500);
}

// sub-function => synchronize_after_storage
function synchronize_after_storage(item) {
	if (typeof item.options !== "undefined" && typeof item.options.key !== "undefined") {
		options = {
			key: item.options.key
		};

		if (options.key.length > 0) {

			console.info("team-bookmark: launch synchronize");

			var xhr = new XMLHttpRequest();
			xhr.open('GET', domain + '/ajax/synchronize.php?key=' + options.key + '&ts=' + new Date().getTime(), true);
			xhr.responseType = 'json';

			xhr.onload = function() {
				if (xhr.status === 200) {

					var obj = xhr.response;

					if (obj.app.name == "team-bookmark" && typeof obj.folder_name != "undefined" && obj.folder_name.length > 0) {

						if (typeof obj.bookmarks != "undefined") { empty_tbtree_issu = obj.bookmarks; }

						folder_name = obj.folder_name;

						version = obj.meta.version;

						if (browser.bookmarks.onCreated.hasListener(update_on_cloud)) { browser.bookmarks.onCreated.removeListener(update_on_cloud); }
						if (browser.bookmarks.onRemoved.hasListener(update_on_cloud)) { browser.bookmarks.onRemoved.removeListener(update_on_cloud); }
						if (browser.bookmarks.onChanged.hasListener(update_on_cloud)) { browser.bookmarks.onChanged.removeListener(update_on_cloud); }
						if (browser.bookmarks.onMoved.hasListener(update_on_cloud))   { browser.bookmarks.onMoved.removeListener(update_on_cloud);   }

						if (is_chrome) {
							browser.bookmarks.search({ title: folder_name_pre + folder_name }, synchronize_folder_found.bind({bookmark: obj.bookmarks}));
						}
						else {
							var searching = browser.bookmarks.search({ title: folder_name_pre + folder_name });
							searching.then(synchronize_folder_found.bind({bookmark: obj.bookmarks}), ff_error);
						}
					}
				}
				else {
					console.error("team-bookmark: could not synchronize, XHR responses KO");
				}
			};
			xhr.send();
		}
		else { console.info("team-bookmark: no key defined."); }
	}
	else { console.info("team-bookmark: options not yet defined."); }
}

// sub-function => update_continue_process
function update_continue_process(node) {
	if (typeof node != "undefined" && node != null) {
		if (node[0].title != folder_name_pre + folder_name) {
			if (is_chrome) {
				browser.bookmarks.update(node[0].id, {
					title: folder_name_pre + folder_name
				});
			}
			else {
				var updating = browser.bookmarks.update(node[0].id, {
					title: folder_name_pre + folder_name
				});
				updating.then(function() { }, ff_error);
			}
			
		}

		var json = JSON.stringify(node[0].children);

		var data = new FormData();
		data.append('key', options.key);
		data.append('version', version);
		data.append('is_chrome', is_chrome);
		data.append('json', json);

		var xhr = new XMLHttpRequest();
		xhr.open('POST', domain + '/ajax/update.php?ts=' + new Date().getTime(), true);
		xhr.responseType = 'json';
		xhr.onload = function() {
			if (xhr.status === 200) {

				var obj = xhr.response;

				if (obj.action == "update_version" && obj.version > 0) {
					version = obj.version;
				}
			}
		};
		xhr.send(data);
	}
	else {
		console.info("the main folder has been deleted, reseting local version");
		version = 0;
	}
}

// sub-function => compare_subtree
function compare_subtree(node) {
	for (var i = 0; i < node[0].children.length; i++) {
		if ((is_chrome && typeof node[0].children[i].url == "undefined") || (!is_chrome && node[0].children[i].type == "folder")) {
			if (is_chrome) {
				browser.bookmarks.removeTree(node[0].children[i].id);
			}
			else {
				var removing = browser.bookmarks.removeTree(node[0].children[i].id);
				removing.then(function() { }, ff_error);
			}			
		}
		else {
			if (is_chrome) {
				browser.bookmarks.remove(node[0].children[i].id);
			}
			else {
				var removing = browser.bookmarks.remove(node[0].children[i].id);
				removing.then(function() { }, ff_error);
			}
		}
	}

	setTimeout(function() {

		var index = 0;

		if (typeof this.tb_tree == "undefined") {
			var tb_tree = empty_tbtree_issu;
			console.info("Fallback: tb_tree is undefined, get new value =>");
		}
		else { var tb_tree = this.tb_tree; }

		if (typeof this.system_tree == "undefined" || typeof this.system_tree.id == "undefined") {
			var system_tree_id = main_id;
			console.info("Fallback: system_tree.id is undefined, get new value =>");
		}
		else { var system_tree_id = this.system_tree.id; }

		if (typeof tb_tree != "undefined" && tb_tree.length > 0 && typeof system_tree_id != "undefined") {
			for (var i = 0; i < tb_tree.length; i++) {
				/* BOOKMARK */
				if (tb_tree[i].url != null) {
					if (is_chrome) {
						browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							url: tb_tree[i].url,
							index: tb_tree[i].index
						});
					}
					else {
						var creation = browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							url: tb_tree[i].url,
							index: tb_tree[i].index
						});
						creation.then(function(node) { });
					}

					index++;
				}
				/* FOLDER */
				else if (tb_tree[i].title != null && tb_tree[i].title.length > 0) {
					if (is_chrome) {
						browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							index: tb_tree[i].index
						}, function(node) {
							compare_bookmark(node, this.newtree);
						}.bind({newtree: tb_tree[i].bookmarks}));
					}
					else {
						var creation = browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							index: tb_tree[i].index
						});
						creation.then(function(node) {
							compare_bookmark(node, this.newtree);
						}.bind({newtree: tb_tree[i].bookmarks}));
					}

					index++;
				}
				/* SEPARATOR */
				else if (!is_chrome) {
					var creation = browser.bookmarks.create({
						parentId: system_tree_id,
						type: "separator",
						title: '',
						url: '',
						index: tb_tree[i].index
					});
					creation.then(function(node) { });

					index++;
				}
			}
		}
		else {
			console.error("invalid tb_tree || system_tree, reseting local version");
			version = 0;
		}
	}.bind({tb_tree: this.tb_tree, system_tree: this.system_tree}), 50);
}

// DO PING

function ping() {
	if (typeof options != "undefined" && typeof options.key != "undefined") {
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
	else {
		synchronize();
	}
}

// TRIGGER A CHANGE, UPDATE CLOUD DATAS

function update_on_cloud() {
	if (is_chrome) {
		browser.bookmarks.getSubTree(main_id, update_continue_process);
	}
	else {
		var get = browser.bookmarks.getSubTree(main_id);
		get.then(update_continue_process, function() {
			console.info("the main folder has been deleted, reseting local version");
			version = 0;
		});
	}
}

// WE DO THE CHANGES IN BOOKMARKS

function compare_bookmark(system_tree, tb_tree) {
	if (main_id.length > 0) {
		if (is_chrome) {
			browser.bookmarks.getSubTree(system_tree.id, compare_subtree.bind({tb_tree: tb_tree, system_tree: system_tree}));
		}
		else {
			var get = browser.bookmarks.getSubTree(system_tree.id);
			get.then(compare_subtree.bind({tb_tree: tb_tree, system_tree: system_tree}), ff_error);
		}
	}
}

// FULL SYNCHRONIZE

function synchronize() {
	if (is_chrome) {
		browser.storage.local.get("options", synchronize_after_storage);
	}
	else {
		var storage = browser.storage.local.get("options");
		storage.then(synchronize_after_storage, ff_error);
	}
}

// STARTUP

console.info("team-bookmark: starting");

var is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
if (is_chrome) { var browser = chrome; }

// search for default root_id

if (is_chrome) {
	browser.bookmarks.getTree(function(items) {
		root_id = items[0].children[0].id;
	});
}
else {
	var tree = browser.bookmarks.getTree();
	tree.then(function(items) {
		for (var i = 0; i < items[0].children.length; i++) {
			if (items[0].children[i].id.startsWith('toolbar_')) {
				root_id = items[0].children[i].id;
			}
		}
		if (root_id.length == 0) { root_id = items[0].children[0].id; }
	}, ff_error);
}


// launch auto synch

setInterval(function () {
	ping();
}, 60000);

synchronize();
