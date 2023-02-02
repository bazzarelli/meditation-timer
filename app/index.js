import clock from "clock";
import * as document from "document";
import { gettext } from "i18n";
import { me } from "appbit";
import { vibration } from "haptics";
import { HeartRateSensor } from "heart-rate";
import { BodyPresenceSensor } from "body-presence";
import { user } from "user-profile";
import * as utils from "./lib/utils";
import * as messaging from "messaging";
import * as simpleSettings from "./lib/device-settings";

const restingHr = user.restingHeartRate || "--";
const TIMER_PLACEHOLDER = "0:00";
const timerMap = {
  OFF: 0,
  FIVE_SECS: 5 * 1000,
  ONE_MIN: 1 * 60 * 1000,
  FIVE_MINS: 5 * 60 * 1000,
  TEN_MINS: 10 * 60 * 1000,
  TWENTY_MINS: 20 * 60 * 1000,
  THIRTY_MINS: 30 * 60 * 1000
};
const intensityMap = {
  BUZZ_LOW: {
    pattern: "confirmation",
    value: "light"
  },
  BUZZ_MED: {
    pattern: "nudge-max",
    value: "medium"
  },
  BUZZ_HIGH: {
    pattern: "ping",
    value: "high"
  }
};

/* Vibration Pattern Names
  "alert" | 3 cycles, morning alarm style [1• 2•• 3• 4••••]
  "confirmation" | [one•] very light, similar to pressing a button
  "confirmation-max" |
  "bump" | [one•] light, similar to pressing a button
  "nudge" | [one••] light
  "nudge-max" | [one••] light but a little more than nudge
  "ping" | [one• two•] punchy
  "ring" | 3 cycles [one•• two•• three••••] -- good for high intensity
*/

let buzzMinderTime = timerMap.OFF;
let buzzIntensity = "BUZZ_MED";
let buzzIntervalID;
let hrm;
let bodyPresence;
let sessionStart;
let durationText;
let sessionStartISO8601;
let elapsedTimeMillis;
let initialHRExecuted;
let initialHR;

/* -------- REMINDER BUZZ -------- */
function reminderBuzz() {
  vibration.start(intensityMap[buzzIntensity].pattern);
  setTimeout(() => {
      vibration.stop();
  }, timerMap.FIVE_SECS);
}

function startReminderBuzz() {
  if (buzzMinderTime) {
    buzzIntervalID = setInterval(reminderBuzz, buzzMinderTime);
  }
}

function stopReminderBuzz() {
  clearInterval(buzzIntervalID);
}

/* -------- SENSOR CHECK -------- */
function checkHeartRate() {
  hrm = new HeartRateSensor({ frequency: 1 });
  if (HeartRateSensor) {
    hrm.addEventListener("reading", () => {
      console.log(`HR: ${hrm.heartRate} BPM`);
      setInitialHR(hrm.heartRate);
    });
    hrm.start();
  }
}

function setInitialHR(hr) {
  if (!initialHRExecuted) {
    initialHR = hr;
    initialHRExecuted = true;
  }
}

function checkBodyPresence() {
  if (BodyPresenceSensor) {
    bodyPresence = new BodyPresenceSensor();
    bodyPresence.addEventListener("reading", () => {
      console.log(`The device is${bodyPresence.present ? '' : ' not'} on the user's body.`);
    });
    bodyPresence.start();
  }
}

function setYogiIconGender() {
    const yogiIconGender = user.gender === "male" ? "i" : "ini";
    const iconYogi = document.getElementById("yogi-emoji");
    const imgYogi = iconYogi.getElementById("yogi-icon");
    imgYogi.href = `images/yog${yogiIconGender}.png`;
}

/* -------- HIDE/SHOW HR AND TIMER -------- */
function updateHRDisplay() {
  const currentHRText = document.getElementById("currentHRText");
  if (currentHRText) {
    currentHRText.text = `${hrm.heartRate} BPM`;
  }
}

function isHRDisplayHidden() {
  const currentHRText = document.getElementById("currentHRText");
  if (currentHRText) {
    return currentHRText.style.display === "none";
  }
  return undefined;
}

function toggleActiveSessionText() {
  const durationText = document.getElementById("durationText");
  const currentHRText = document.getElementById("currentHRText");
  const currentHRTextHidden = isHRDisplayHidden();

  if (currentHRTextHidden) {
    updateHRDisplay();
    currentHRText.style.display = "inline";
    durationText.style.display = "none";
  } else {
    currentHRText.style.display = "none";
    durationText.style.display = "inline";
  }
}

function resetSession() {
    // Reset internal session variables
    sessionStart = undefined;
    clock.ontick = undefined;
    stopReminderBuzz();
}

function sessionFinishedCleanUp() {
  const finishBtn = document.getElementById("btnFinish");
  // takes over finish button to advance to summary page
  finishBtn.addEventListener("click", () => {
    document.location.assign('session-finish.view').then(populateSummaryView);
  });

  const sessionStatus = document.getElementById("sessionStatus");
  // status updates to session finished
  sessionStatus.text = gettext("session_finished");

  const btnFinish = document.getElementById("btnFinish");
  // finish button renamed to "view summary"
  btnFinish.text = gettext("view_summary");
}

function populateSummaryView() {
  const sessionSummary = document.getElementById("sessionSummary");
  sessionSummary.text = gettext("session_summary");

  const durationSummary = document.getElementById("durationSummary");
  durationSummary.text = durationText.text;

  const startHR = document.getElementById("startHR");
  startHR.text = `${initialHR}`;

  const restingHR = document.getElementById("restingHR");
  restingHR.text = restingHr;

  const sessionSummaryDetails = document.getElementById("sessionSummaryDetails");
  sessionSummaryDetails.text = gettext("session_summary_details")
}

function sessionDurationUpdate() {
    if (durationText === undefined) {
        return;
    }
    let now = new Date();
    let millis = now - sessionStart;
    elapsedTimeMillis = millis; // for mindfulness api call
    durationText.text = utils.formatActiveTime(millis);

    // update the HR value each tick of the clock
    let currentHRTextHidden = isHRDisplayHidden();
    if (!currentHRTextHidden) {
      updateHRDisplay();
    }
}

function sendMindfulSessionData() {
    const meditationData = {
      startDateTime: sessionStartISO8601,
      endDateTime: utils.getDateTimeWithOffset(),
      contentDuration: elapsedTimeMillis,
    }

    // Send Meditation session data
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send(meditationData);
    } else {
      console.log('Peer socket messaging not available');
    }
}

function startSessionTimer() {
  durationText = document.getElementById("durationText");
  durationText.text = TIMER_PLACEHOLDER;
  // ISO-8601 format needed for api call
  sessionStartISO8601 = utils.getDateTimeWithOffset();
  sessionStart = new Date();
  clock.granularity = "seconds";
  clock.ontick = sessionDurationUpdate;
}

function updateSessionView() {
  setYogiIconGender();
  startSessionTimer();
  const sessionStatus = document.getElementById("sessionStatus");
  sessionStatus.text = gettext("session_is_active");

  //SESSION SCREEN TAP
  const activeSessionContainer = document.getElementById("active-session-container");
  activeSessionContainer.addEventListener("mousedown", () => {
    toggleActiveSessionText();
  });

  //FINISH BUTTON CLICK
  const finishBtn = document.getElementById("btnFinish");
  finishBtn.addEventListener("click", () => {
    sendMindfulSessionData();
    sessionFinishedCleanUp();
    resetSession(); // clear values from previous session
    hrm.stop(); // shut down the hr monitor
  });
};

function sessionViewStart() {
    initialHRExecuted = false;
    checkHeartRate();
    checkBodyPresence();
    // don't exit after default 2 mins
    me.appTimeoutEnabled = false;
    // start the buzz-minder
    startReminderBuzz();

    if (bodyPresence.present) {
      document.location.replace('session.view').then(updateSessionView);
    }

}

/* -------- SETTINGS -------- */
function settingsCallback(data) {
  if (!data) {
    return;
  }
  if (data.buzzMinderTime) {
      buzzMinderTime = timerMap[data.buzzMinderTime];
      updateBuzzMinderSetting(buzzMinderTime);
  }

  if (data.buzzIntensity) {
    buzzIntensity = data.buzzIntensity;
    updateBuzzMinderIntensity(buzzIntensity);
  }
}

function updateBuzzMinderSetting(buzzMinderTime) {
  const buzzMinderSetting = document.getElementById("buzzMinderSetting");
  const buzzMinderSettingLabel = gettext("buzz_minder_setting_label");
  const minutesLabel = gettext("minutes");
  const buzzMinderTimeVal = Math.floor(buzzMinderTime / 60000);
  buzzMinderSetting.text = `${buzzMinderSettingLabel}: ${buzzMinderTimeVal} ${minutesLabel}`;
}

function updateBuzzMinderIntensity(buzzIntensity) {
  const buzzMinderIntensity = document.getElementById("buzzMinderIntensity");
  const buzzMinderIntensityLabel = gettext("buzz_minder_intensity_label");
  const buzzMinderIntensityVal = intensityMap[buzzIntensity].value;

  if (buzzMinderTime) {
    buzzMinderIntensity.text = `${buzzMinderIntensityLabel}: ${buzzMinderIntensityVal}`;
  } else {
    buzzMinderIntensity.text = "";
  }
}

function updateMainMenu() {
  simpleSettings.initialize(settingsCallback);
  const beginHeader = document.getElementById("beginText");
  beginHeader.text = gettext("begin");
  updateBuzzMinderSetting(buzzMinderTime);
  updateBuzzMinderIntensity(buzzIntensity);

  document.getElementById("start-button-screen/start").addEventListener("click", sessionViewStart);
}

// start up the UI
updateMainMenu();
