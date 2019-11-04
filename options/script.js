/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const $ = document.getElementById.bind(document);

function ff_error(error) { console.log(`An error: ${error}`); }

function after_storage_set() {
	$("saved").classList.add("saving");
	setTimeout(function() { $("saved").classList.remove("saving"); }, 2000);
}

function after_storage_get(item) {
	if (typeof item.options.key !== "undefined") {
		$("key").value = item.options.key.trim()
	}
}

var is_chrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
if (is_chrome) { var browser = chrome; }

const save_options = () => {

	if (is_chrome) {
		browser.storage.local.set({
			options: {
				key: $("key").value.trim()
			}
		}, after_storage_set);
	}
	else {
		browser.storage.local.set({
			options: {
				key: $("key").value.trim()
			}
		}).then(after_storage_set, ff_error);
	}	
};

const restore_options = () => {
	if (is_chrome) {
		browser.storage.local.get("options", after_storage_get);
	}
	else {
		browser.storage.local.get("options").then(after_storage_get, ff_error);
	}
};

document.addEventListener("DOMContentLoaded", restore_options);

$("save").addEventListener("click", save_options);
