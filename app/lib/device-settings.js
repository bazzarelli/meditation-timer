/*
  Responsible for loading, applying and saving settings.
  Requires companion/simple/companion-settings.js
  Callback should be used to update your UI.
*/
import { me } from "appbit";
import { me as device } from "device";
import * as fs from "fs";
import * as messaging from "messaging";

const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

let settings, onsettingschange;

export function initialize(callback) {
    settings = loadSettings();
    onsettingschange = callback;
    onsettingschange(settings);
}

// Received message containing settings data
messaging.peerSocket.addEventListener("message", function (evt) {
    if (evt.data.key === "buzzMinderTime") {
      settings["buzzMinderTime"] = evt.data.value.values[0].value;
    } else if (evt.data.key === "buzzIntensity") {
      settings["buzzIntensity"] = evt.data.value.values[0].value;
    }

    onsettingschange(settings); // sending the settings data into app/index
});

// Register for the unload event
me.addEventListener("unload", saveSettings);

// Load settings from filesystem
function loadSettings() {
    try {
        // saved fs setting looks like {"buzzMinderTime":"FIVE_MINS"}
        console.log('device settings:: saved file system setting', JSON.stringify( fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE) ))
        return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
    } catch (ex) {
        return {};
    }
}

// Save settings to the filesystem
function saveSettings() {
    fs.writeFileSync(SETTINGS_FILE, settings, SETTINGS_TYPE);
}
