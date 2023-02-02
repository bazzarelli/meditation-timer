import * as messaging from "messaging";
import { me as companion } from 'companion';
import * as simpleSettings from "./simple/companion-settings";
import * as utils from "../app/lib/utils";

simpleSettings.initialize();
/* example POST body content
  {
    "activityName": "Meditation",
    "activityId": 7075,
    "sessionType": "mobile",
    "startDateTime": "2020-08-21T00:31:22-07:00",
    "endDateTime": "2020-08-21T00:32:30-07:00",
    "contentDuration": 64367
  }
*/

const accessToken = companion.accessTokens.fitbit;
const mindfulnessSessionData = {
    activityName: 'Meditation',
    activityId: 7075,
    sessionType: 'mobile',
    startDateTime: null,
    endDateTime: null,
    contentDuration: null
}

const postMeditationSession = (function() {
  let ranOnce; // block multiple POST requests
  return function() {
      if (!ranOnce) {
        ranOnce = true;
        fetch(`https://api.fitbit.com/1/user/-/mindfulness/sessions`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`
          },
          body: JSON.stringify(mindfulnessSessionData)
        }).catch(err => console.error('Fetch error: ' + err));
      }
  };
})();

// Message is received
messaging.peerSocket.onmessage = evt => {
    const exerciseDetails = evt.data;

    // check for the correct data object
    if ('startDateTime' in exerciseDetails) {
      mindfulnessSessionData.startDateTime = exerciseDetails.startDateTime;
      mindfulnessSessionData.endDateTime = exerciseDetails.endDateTime;
      mindfulnessSessionData.contentDuration = exerciseDetails.contentDuration;
    }

    // checking that all required fields have values before sending data
    if (!utils.hasNull(mindfulnessSessionData)) {
        postMeditationSession();
    }
};
