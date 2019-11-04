/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const $ = document.getElementById.bind(document);
const logError = console.exception.bind(console);

const save_options = () => {
	browser.storage.local.set({
		options:
			{
				key: $("key").value.trim()
			}
	}).then(function() {
		$("saved").classList.add("saving");
		setTimeout(function() { $("saved").classList.remove("saving"); }, 2000);
	}, logError);
};

const restore_options = () => {
	browser.storage.local.get("options").then(function(item) {
		if (typeof item.options.key !== "undefined") {
			$("key").value = item.options.key.trim()
		}
	}, logError);
};

document.addEventListener("DOMContentLoaded", restore_options);

$("save").addEventListener("click", save_options);
