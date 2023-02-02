/** @description check an object for null values
 * @param {object} target The object to check.
 * @return {boolean}
 */
export function hasNull(target) {
    for (let member in target) {
        if (target[member] == null)
            return true;
    }
    return false;
}

/** @description Add zero in front of numbers < 10.
 * @param {number} num The number to pad.
 * @return {string}
 */
export function zeroPad(num) {
    if (num < 10) {
        num = "0" + num;
    }
    return num;
}

/** @description Toggle visibility of an element.
 * @param {object} element The element to toggle.
 */
export function toggle(element) {
    element.style.display =
        element.style.display === "inline" ? "none" : "inline";
}

/** @description Hide an element.
 * @param {object} element The element to hide.
 */
export function hide(element) {
    element.style.display = "none";
}

/** @description Show an element.
 * @param {object} element The element to show.
 */
export function show(element) {
    element.style.display = "inline";
}

/** @description Formats the time spent in milliseconds into mm:ss or hh:mm:ss.
 * @param {number} activeTime The time in milliseconds.
 * @return {string}
 */
export function formatActiveTime(activeTime) {
    let seconds = (activeTime / 1000).toFixed(0);
    let minutes = Math.floor(seconds / 60);
    let hours;
    if (minutes > 59) {
        hours = Math.floor(minutes / 60);
        hours = zeroPad(hours);
        minutes = minutes - hours * 60;
        minutes = zeroPad(minutes);
    }
    seconds = Math.floor(seconds % 60);
    seconds = zeroPad(seconds);
    if (hours) {
        return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
}

/** @description Provides mindfulness API required format
 * Returns a date time string that conforms to ISO-8601
 * @return {string} e.g. '2020-06-30T15:59:00-07:00'
 */
export function getDateTimeWithOffset() {
    // UTC time (needs to be converted to local)
    const date = new Date();
    const timezoneOffsetMin = date.getTimezoneOffset();
    // multiply by 60000 so both values are in milliseconds
    const localDateTime = new Date(date.getTime() - (timezoneOffsetMin * 60000)).toISOString();
    const dateTimeString = localDateTime.split('.')[0];

    let offsetHrs = parseInt(Math.abs(timezoneOffsetMin / 60), 10);
    let offsetMin = Math.abs(timezoneOffsetMin % 60);
    let tzStandardized;

    if (offsetHrs < 10) {
        offsetHrs = '0' + offsetHrs;
    }

    if (offsetMin < 10) {
        offsetMin = '0' + offsetMin;
    }

    // Add correct symbol to offset
    if (timezoneOffsetMin < 0) {
        tzStandardized = `+${offsetHrs}:${offsetMin}`;
    }
    else if (timezoneOffsetMin > 0) {
        tzStandardized = `-${offsetHrs}:${offsetMin}`;
    }
    // If offset is 0, it means timezone is UTC
    else if (timezoneOffsetMin === 0) {
        tzStandardized = 'Z';
    }

    return `${dateTimeString}${tzStandardized}`;
}

