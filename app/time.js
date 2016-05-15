'use strict';

define(['./yc'], function (YC) {

  /**
   * Pads a 2-digit number with a leading zero, if needed.
   */
  var pad = function (number) {
    return number < 10 ? '0' + number : String(number);
  };

  /**
   * Gets a timestamp in the format "hh:mm:ss A".
   */
  YC.getTimestamp = function (ms) {
    var date = ms === undefined ? new Date() : new Date(ms);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var period;
    if (hours < 12) {
      if (hours === 0) {
        hours = 12;
      }
      period = 'AM';
    } else {
      if (hours > 12) {
        hours -= 12;
      }
      period = 'PM';
    }
    return [pad(hours), pad(minutes), pad(seconds)].join(':') + ' ' + period;
  };

  /**
   * Formats milliseconds as "00:00" (MINS:SECS).
   */
  YC.formatMs = function (ms) {
    // Round to make for a more-accurate end result.
    ms = Math.round(ms / 1000) * 1000;
    var seconds = Math.floor(ms / 1000) % 60;
    var minutes = Math.floor(ms / 60000);
    return pad(minutes) + ':' + pad(seconds);
  };

  /**
   * Get the first millisecond value (midnight) for the day represented by `ms`.
   */
  YC.startOfDay = function (ms) {
    var date = new Date(ms);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  /**
   * Get a representation of the current day.
   */
  YC.getDaystamp = function (ms) {
    return new Date(ms).toLocaleDateString();
  };

});
