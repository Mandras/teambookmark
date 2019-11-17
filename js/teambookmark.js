var domain = "https://www.teambookmark.org";
var synchronization_processing = false;
var empty_tbtree_issu = [];
var ping_interval = 60;
var is_chrome = false;
var has_trash = false;
var stringified = '';
var root_id = '';
var main_id = '';
var folder_name;
var version = 0;
var options;
var emoji;

function ff_error(error) { console.error(`${error}`); }

// sub-function => delete_folder_found
function delete_folder_found(items) {
	for (var i = 0 ; i < items.length ; i++) {
		if (is_chrome) {
			browser.bookmarks.removeTree(items[i].id);
		}
		else {
			var removing = browser.bookmarks.removeTree(items[i].id);
			removing.then(function() { }, ff_error);
		}
	}
}

// sub-function => compare_old_folder_name
function compare_old_folder_name(item) {
	if (typeof item !== "undefined" && typeof item.last_used_folder_name !== "undefined" && item.last_used_folder_name.length > 0) {
		var last_used_folder_name = item.last_used_folder_name;
		if (last_used_folder_name != (emoji + ' ' + folder_name)) {
			if (is_chrome) {
				browser.bookmarks.search({ title: last_used_folder_name }, delete_folder_found);
			}
			else {
				var searching = browser.bookmarks.search({ title: last_used_folder_name });
				searching.then(delete_folder_found, ff_error);
			}
		}
	}
}

// sub-function => synchronize_folder_found
function synchronize_folder_found(items) {
	if (items.length > 1) {
		for (var i = 0 ; i < items.length ; i++) {
			if (is_chrome) {
				if (has_trash != false) {
					browser.bookmarks.removeTree(items[i].id, function() {
						browser.bookmarks.removeTree(this.check_delete);
					}.bind({check_delete: items[i].id}));
				}
				else {
					browser.bookmarks.removeTree(items[i].id);
				}
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
				title: emoji + ' ' + folder_name,
				index: 0
			}, function(node) {
				console.info("teambookmark: create root for toolbar");
				main_id = node.id;
				compare_bookmark(node, this.bookmark);

				browser.storage.local.set({
					last_used_folder_name: emoji + ' ' + folder_name
				}, function() { });
			});
		}
		else {
			var creation = browser.bookmarks.create({
				parentId: root_id,
				title: emoji + ' ' + folder_name,
				index: 0
			});
			creation.then(function(node) {
				console.info("teambookmark: create root for toolbar");
				main_id = node.id;
				compare_bookmark(node, this.bookmark);

				browser.storage.local.set({
					last_used_folder_name: emoji + ' ' + folder_name
				}).then(function() { }, ff_error);
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

		if (main_id.length > 0) {
			if (is_chrome) {
				browser.bookmarks.getSubTree(main_id, stringify_bookmark);
			}
			else {
				var get = browser.bookmarks.getSubTree(main_id);
				get.then(stringify_bookmark, ff_error);
			}
		}
	}, 1500);
}

// sub-function => test_options_after_storage
function test_options_after_storage(item) {
	if (typeof options != "undefined" && typeof options.key != "undefined" && typeof item.options !== "undefined" && typeof item.options.key !== "undefined" && options.key != item.options.key) {
		console.info("teambookmark: option (key) has changed");
		options.key = item.options.key;
		stringified = '';
		version = 0;
	}
}

// sub-function => synchronize_after_storage
function synchronize_after_storage(item) {
	if (typeof item.options !== "undefined" && typeof item.options.key !== "undefined") {
		options = {
			key: item.options.key
		};

		if (options.key.length > 0) {

			console.info("teambookmark: launch synchronize");

			var xhr = new XMLHttpRequest();
			xhr.open('GET', domain + '/api/synchronize.php?key=' + options.key + '&ts=' + new Date().getTime(), true);
			xhr.responseType = 'json';

			xhr.onload = function() {
				if (xhr.status === 200) {

					var obj = xhr.response;

					if (typeof obj.meta != "undefined" && typeof obj.meta.deleted != "undefined" && obj.meta.deleted == 1) {
						console.error("teambookmark: the TeamKey you are using is deleted");
						synchronization_processing = false;
						return ;
					}

					if (obj.app.name == "teambookmark" && typeof obj.meta != "undefined" && typeof obj.meta.folder_name != "undefined" && obj.meta.folder_name.length > 0 && typeof obj.meta.emoji != "undefined" && typeof obj.meta.version != "undefined") {

						if (typeof obj.bookmarks != "undefined") { empty_tbtree_issu = obj.bookmarks; }

						folder_name = obj.meta.folder_name;
						version = obj.meta.version;
						emoji = obj.meta.emoji;

						if (is_chrome) {
							browser.storage.local.get("last_used_folder_name", compare_old_folder_name);
						}
						else {
							var storage = browser.storage.local.get("last_used_folder_name");
							storage.then(compare_old_folder_name, ff_error);
						}

						if (browser.bookmarks.onCreated.hasListener(update_on_cloud)) { browser.bookmarks.onCreated.removeListener(update_on_cloud); }
						if (browser.bookmarks.onRemoved.hasListener(update_on_cloud)) { browser.bookmarks.onRemoved.removeListener(update_on_cloud); }
						if (browser.bookmarks.onChanged.hasListener(update_on_cloud)) { browser.bookmarks.onChanged.removeListener(update_on_cloud); }
						if (browser.bookmarks.onMoved.hasListener(update_on_cloud))   { browser.bookmarks.onMoved.removeListener(update_on_cloud);   }

						if (is_chrome) {
							if (has_trash != false) {
								browser.bookmarks.getSubTree(has_trash, function(node) {
									if (node.length > 0 && typeof node[0].children != "undefined") {
										for (var i = 0 ; i < node[0].children.length ; i++) {
											if (node[0].children[i].title == emoji + ' ' + folder_name) {
												console.info("teambookmark: folder found in Trash ... deleting ...");
												browser.bookmarks.removeTree(node[0].children[i].id);
											}
										}
										setTimeout(function() {
											browser.bookmarks.search({ title: emoji + ' ' + folder_name }, synchronize_folder_found.bind({bookmark: obj.bookmarks}));
										}, 50);
									}
								});
							}
							else {
								browser.bookmarks.search({ title: emoji + ' ' + folder_name }, synchronize_folder_found.bind({bookmark: obj.bookmarks}));
							}
						}
						else {
							var searching = browser.bookmarks.search({ title: emoji + ' ' + folder_name });
							searching.then(synchronize_folder_found.bind({bookmark: obj.bookmarks}), ff_error);
						}

						setTimeout(function() { synchronization_processing = false; }, 100);
					}
					else {
						console.error("teambookmark: JSON content datas does not match standart");
						synchronization_processing = false;
					}
				}
				else {
					console.error("teambookmark: could not synchronize, XHR responses KO");
					synchronization_processing = false;
				}
			};
			xhr.onerror = function(e) {
				if (typeof e.type != "undefined" && e.type == "error" && typeof e.loaded != "undefined" && e.loaded == 0) {
					console.error("Could not synchronize, may be offline ?");
				}
				synchronization_processing = false;
			};
			xhr.send();
		}
		else {
			console.info("teambookmark: no key defined.");
			synchronization_processing = false;
		}
	}
	else {
		console.info("teambookmark: options not yet defined.");
		synchronization_processing = false;
	}
}

// sub-function => update_continue_process
function update_continue_process(node) {
	if (typeof node != "undefined" && node != null) {
		if (node[0].title != emoji + ' ' + folder_name) {
			if (is_chrome) {
				browser.bookmarks.update(node[0].id, {
					title: emoji + ' ' + folder_name
				});
			}
			else {
				var updating = browser.bookmarks.update(node[0].id, {
					title: emoji + ' ' + folder_name
				});
				updating.then(function() { }, ff_error);
			}
		}
		else if (has_trash != false && node[0].parentId == has_trash) {
			console.info("teambookmark: the main folder has been sent to trash, reseting local version");
			stringified = '';
			version = 0;
			return ;
		}

		var json = JSON.stringify(node[0].children);

		if (json == stringified) {
			console.log("teambookmark: no change detected, avoid useless update");
		}
		else {
			var data = new FormData();
			data.append('key', options.key);
			data.append('version', version);
			data.append('is_chrome', is_chrome);
			data.append('json', json);

			var xhr = new XMLHttpRequest();
			xhr.open('POST', domain + '/api/update.php?ts=' + new Date().getTime(), true);
			xhr.responseType = 'json';
			xhr.onload = function() {
				if (xhr.status === 200) {

					var obj = xhr.response;

					if (obj.action == "update_version" && obj.version > 0) {
						version = obj.version;
					}
					else if (obj.action == "invalid_version" && obj.version < version) {
						stringified = '';
						version = 0;
					}
					else if (obj.action == "invalid_version" && obj.version > version) {
						synchronize();
					}
				}
			};
			xhr.onerror = function(e) {
				if (typeof e.type != "undefined" && e.type == "error" && typeof e.loaded != "undefined" && e.loaded == 0) {
					console.error("Could not update, may be offline ?");
					version = 0;
				}
			};
			xhr.send(data);
		}
	}
	else {
		console.info("teambookmark: the main folder has been deleted, reseting local version");
		stringified = '';
		version = 0;
	}
}

// sub-function => compare_subtree
function compare_subtree(node) {
	for (var i = 0 ; i < node[0].children.length ; i++) {
		if ((is_chrome && typeof node[0].children[i].url == "undefined") || (!is_chrome && node[0].children[i].type == "folder")) {
			if (is_chrome) {
				if (has_trash != false) {
					browser.bookmarks.removeTree(node[0].children[i].id, function() {
						browser.bookmarks.removeTree(this.check_delete);
					}.bind({check_delete: node[0].children[i].id}));
				}
				else {
					browser.bookmarks.removeTree(node[0].children[i].id);
				}
			}
			else {
				var removing = browser.bookmarks.removeTree(node[0].children[i].id);
				removing.then(function() { }, ff_error);
			}			
		}
		else {
			if (is_chrome) {
				if (has_trash != false) {
					browser.bookmarks.remove(node[0].children[i].id, function() {
						browser.bookmarks.remove(this.check_delete);
					}.bind({check_delete: node[0].children[i].id}));
				}
				else {
					browser.bookmarks.remove(node[0].children[i].id);
				}
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
			console.info("teambookmark: fallback - tb_tree is undefined, get fallback value");
		}
		else { var tb_tree = this.tb_tree; }

		if (typeof this.system_tree == "undefined" || typeof this.system_tree.id == "undefined") {
			var system_tree_id = main_id;
			console.info("teambookmark: fallback - system_tree.id is undefined, get fallback value");
		}
		else { var system_tree_id = this.system_tree.id; }

		if (typeof tb_tree != "undefined" && tb_tree.length > 0 && typeof system_tree_id != "undefined") {
			for (var i = 0 ; i < tb_tree.length ; i++) {
				/* BOOKMARK */
				if (tb_tree[i].url != null) {
					if (is_chrome) {
						browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							url: tb_tree[i].url,
							index: index
						});
					}
					else {
						var creation = browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							url: tb_tree[i].url,
							index: index
						});
						creation.then(function(node) {
							setTimeout(function() {
								var moving_bookmark = browser.bookmarks.move(this.node_id, {index: this.reassigned_index});
								moving_bookmark.then(function() { }, ff_error);
							}.bind({reassigned_index: this.reassigned_index, node_id: node.id}), 20);
						}.bind({reassigned_index: index}));
					}

					index++;
				}
				/* FOLDER */
				else if (tb_tree[i].title != null && tb_tree[i].title.length > 0) {
					if (is_chrome) {
						browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							index: index
						}, function(node) {
							compare_bookmark(node, this.newtree);
						}.bind({newtree: tb_tree[i].bookmarks}));
					}
					else {
						var creation = browser.bookmarks.create({
							parentId: system_tree_id,
							title: tb_tree[i].title,
							index: index
						});
						creation.then(function(node) {
							setTimeout(function() {
								var moving_bookmark = browser.bookmarks.move(this.node_id, {index: this.reassigned_index});
								moving_bookmark.then(function() { }, ff_error);
							}.bind({reassigned_index: this.reassigned_index, node_id: node.id}), 20);
							compare_bookmark(node, this.newtree);
						}.bind({newtree: tb_tree[i].bookmarks, reassigned_index: index}));
					}

					index++;
				}
				/* SEPARATOR */
				/*
				else if (!is_chrome) {
					var creation = browser.bookmarks.create({
						parentId: system_tree_id,
						type: "separator",
						title: '',
						url: '',
						index: tb_tree[i].index
					});
					creation.then(function(node) {
						setTimeout(function() {
							var moving_bookmark = browser.bookmarks.move(this.node_id, {index: this.reassigned_index});
							moving_bookmark.then(function() { }, ff_error);
						}.bind({reassigned_index: this.reassigned_index, node_id: node.id}), 20);
					}.bind({reassigned_index: tb_tree[i].index}));

					index++;
				}
				*/
			}
		}
	}.bind({tb_tree: this.tb_tree, system_tree: this.system_tree}), 50);
}

// DO PING

function ping() {
	if (typeof options != "undefined" && typeof options.key != "undefined" && options.key.length > 0) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', domain + '/api/ping.php?key=' + options.key + '&version=' + version + '&ts=' + new Date().getTime(), true);
		xhr.responseType = 'json';

		xhr.onload = function() {
			if (xhr.status === 200) {

				var obj = xhr.response;

				if (obj.version > 0 && obj.version > version) {
					synchronize();
				}
			}
		};
		xhr.onerror = function(e) {
			if (typeof e.type != "undefined" && e.type == "error" && typeof e.loaded != "undefined" && e.loaded == 0) {
				console.error("Could not ping, may be offline ?");
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
			console.info("teambookmark: the main folder has been deleted, reseting local version");
			stringified = '';
			version = 0;
		});
	}
}

// WE STOCK BOOKMARKS IN VARIABLE TO AVOID USELESS UPDATE

function stringify_bookmark(node) {
	if (typeof node != "undefined" && typeof node[0] != "undefined" && typeof node[0].children != "undefined") {
		stringified = JSON.stringify(node[0].children);
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

	if (synchronization_processing) {
		console.info("teambookmark: synchronization is already processing, so we dismiss this one");
		return ;
	}
	synchronization_processing = true;

	if (is_chrome) {
		browser.storage.local.get("options", synchronize_after_storage);
	}
	else {
		var storage = browser.storage.local.get("options");
		storage.then(synchronize_after_storage, ff_error);
	}
}

// STARTUP

console.info("teambookmark: starting addon");

var is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
if (is_chrome) { var browser = chrome; }

// search for default root_id and Trash root

if (is_chrome) {
	browser.bookmarks.getTree(function(items) {
		root_id = items[0].children[0].id;

		for (var i = 0 ; i < items[0].children.length ; i++) {
			if (items[0].children[i].title == "Trash") {
				has_trash = items[0].children[i].id;
			}
		}
	});
}
else {
	var tree = browser.bookmarks.getTree();
	tree.then(function(items) {
		for (var i = 0 ; i < items[0].children.length ; i++) {
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
}, ping_interval * 1000);

// test if the options has changed

setInterval(function () {
	if (is_chrome) {
		browser.storage.local.get("options", test_options_after_storage);
	}
	else {
		var storage = browser.storage.local.get("options");
		storage.then(test_options_after_storage, ff_error);
	}
}, 5000);

synchronize();
