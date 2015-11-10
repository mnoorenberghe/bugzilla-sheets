/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Original author: MattN

// TODO: configure bugzilla server address

function Bug(id) {
  this.id = id;
  this.fields = {};
  this.error = null;
}
Bug.prototype = {
  fetch: function(fieldNames) {
    Logger.log("fetch: " + fieldNames);
    var url = "https://bugzilla.mozilla.org/rest/bug/" + this.id + "?include_fields=id," + fieldNames.join(",");
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var responseCode = response.getResponseCode();
    Logger.log(responseCode);
    //Logger.log(response.getContentText());
    var result = JSON.parse(response.getContentText());
    Logger.log(result);
    var bugs = result["bugs"];
    Logger.log((result.error == true) + " " + (result.code == 102) + " " + (responseCode == 401));
    if (result.error == true && result.code == 102 && responseCode == 401) {
      this.fields = {
        id: this.id,
        summary: "(SECURE BUG)"
      };
      return true;
    } else if (!bugs || !bugs.length) {
      Logger.log(response.getContentText());
      this.error = result.message || responseCode;
      return false; 
    }
    this.fields = bugs[0];
    return true;
  },
  
  getUserNickname: function(fieldObjectKey) {
    Logger.log("getUserNickname: " + fieldObjectKey);
    var userDetails = this.getField(fieldObjectKey);
    var nickname = userDetails.real_name;
    Logger.log("%s %s", userDetails, userDetails.real_name);
    if (typeof(nickname) === "undefined") {
      // e.g. security bug - return undefined so we don't overwrite manual assignee
      return nickname; 
    }
    if (userDetails.email == "nobody@mozilla.org") { // TODO: configurable
      return "";
    }
    // Try to get the nickname
    var matches = nickname.match(/:([^)\] ]+)/);
    if (matches) {
      nickname = matches[1];
    }
    return nickname;
  },
  
  getField: function(fieldName) {
    return typeof(this.fields[fieldName]) === "undefined" ? "" : this.fields[fieldName];
  },
  
  getFlag: function(bugFlagName, prop) {
    if (!prop) {
      prop = "status";
    }
    var flags = this.getField("flags");
    if (!flags) {
      return undefined;
    }
    var flag = flags.filter(function(flag) {
      return flag.name == bugFlagName;
    });
    if (flag.length) {
      return flag[0][prop];
    }
  },
  
  getQEVerify: function() {
    var re = /\[qa([-+?])\]/i;
    var flag = this.getFlag("qe-verify");
    if (typeof(flag) !== "undefined") {
      return flag;
    }
    var qaWBMatches = this.getField("cf_qa_whiteboard").match(re);
    if (qaWBMatches) {
      return qaWBMatches[1];
    }
    var wBMatches = this.getField("whiteboard").match(re);
    if (wBMatches) {
      return wBMatches[1];
    }
    
    return "?";
  },

  // TODO: in review and blocked statuses
  // TODO: verified when qa- and RESO
  // TODO: LANDED when [fixed-in…]
  getStatus: function() {
    var status = this.getField("status");
    if (!status) {
      return undefined;
    }
    if (status == "NEW" && this.getUserNickname()) {
      status == "ASSIGNED";
    }
    
    return status;
  },
  
  getSummaryLink: function() {
    var escapedSummary = this.getField("summary").replace(/"/g, '""');
    return '=HYPERLINK("https://bugzilla.mozilla.org/show_bug.cgi?id=' + this.id + '", "' + escapedSummary + '")';
  },
  
  // Eng or UX by looking in summary and whiteboard
  getType: function() {
    var type = "ENG";
    var re = /\[ux\]/i;
    if (re.test(this.getField("whiteboard")) || re.test(this.getField("summary"))) {
      type = "UX";
    }
    return type;
  },
}

function isValidBugNumber(value) {
  if(/^[1-9][0-9]*$/.test(value)) {
    return true;
  }
  return false;
}
