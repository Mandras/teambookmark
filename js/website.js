// - - - - - - - - - - - - - - - - - - - - -
// This script save the option 'key' if:
// - The addon is installed (ofc)
// - The option 'key' is not already set
// - The user is on the page 'https://www.teambookmark.org/team'
// - The user has just validated his email
// - The user is still logged in the website
// - - - - - - - - - - - - - - - - - - - - -

const $ = document.getElementById.bind(document);

function ff_error(error) { console.log(`An error: ${error}`); }

function after_storage_set() {
	$('p-no-autosave').style.display = 'none';
	$('p-autosave').style.display = 'block';
}

function set_key_after_storage(item) {
	if (typeof item.options == "undefined" || typeof item.options.key == "undefined" || item.options.key.length == 0) {

		var request = new XMLHttpRequest();
		request.open('GET', 'https://www.teambookmark.org/ajax/get_teamkey.php?ts=' + new Date().getTime(), true);

		request.onload = function() {
			if (this.status == 200) {
				var resp = this.response;

				var key_to_save = resp.trim();

				if (is_chrome) {
					browser.storage.local.set({
						options: {
							key: key_to_save
						}
					}, after_storage_set);
				}
				else {
					browser.storage.local.set({
						options: {
							key: key_to_save
						}
					}).then(after_storage_set, ff_error);
				}
			}
			else { }
		};

		request.onerror = function() { };

		request.send();
	}
}

if (window.location.hostname == "www.teambookmark.org") {
	var is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
	if (is_chrome) { var browser = chrome; }

	if ($('trigger-save-teamkey')) {
		if (is_chrome) {
			browser.storage.local.get("options", set_key_after_storage);
		}
		else {
			var storage = browser.storage.local.get("options");
			storage.then(set_key_after_storage, ff_error);
		}
	}
	if ($('save-new-folder-name')) {
		$('save-new-folder-name').addEventListener('click', function() {
			if (is_chrome) {
				browser.runtime.sendMessage({
					action: "folder_name_changed"
				}, function() { });
			}
			else {
				var sending = browser.runtime.sendMessage({
					action: "folder_name_changed"
				});
				sending.then(function() { }, ff_error);  
			}
		});
	}

	$("body").classList.add('has-addon');
}