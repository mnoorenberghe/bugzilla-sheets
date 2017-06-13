/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Original author: MattN

var SETTINGS = {
  HEADER_ROWS: 1, // Rows to ignore
  BUG_ID_COLUMN: 1, // = A
  BUG_COLUMNS: ["summary", "status", "nickname:assigned_to_detail"],
  ADDITIONAL_FETCHED_FIELDS: ["assigned_to", "resolution", "whiteboard", "flags", "cf_qa_whiteboard"],
  RECIPIENT_EMAIL: Session.getActiveUser().getEmail(),
  RECIPIENT_EMAIL_TITLE : "Batch completed"
};

// TODO: Be careful of performance and quota with update all. Perhaps just a batch instead of all. e.g. with last update column deletion.
// TODO: deal with existing BG colours and conditional formatting
// TODO: maybe don't assign same BUG_ID_COLUMN for the whole document, only sheet
// TODO: support clock triggers

function createSpreadsheetEditTrigger() {
  // Only one per type per spreadsheet is allowed so remove any existing first.
  removeSpreadsheetEditTrigger();

  var ss = SpreadsheetApp.getActive();
  // TODO: only active sheet
  ScriptApp.newTrigger('editTrigger')
      .forSpreadsheet(ss)
      .onEdit()
      .create();
}

function removeSpreadsheetEditTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() != ScriptApp.EventType.ON_EDIT) {
      continue;
    }
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

// Event object described at https://developers.google.com/apps-script/guides/triggers/events
function editTrigger(e) {
  lookForBugNumberChange(e);
}

/**
 * Runs when the add-on is installed.
 */
function onInstall() {
  onOpen();
}

/**
 * Adds a custom menu to the active spreadsheet.
 * The onOpen() function, when defined, is automatically invoked whenever the
 * spreadsheet is opened.
 */
function onOpen() {
  var addonMenu = SpreadsheetApp.getUi().createAddonMenu();
  addonMenu
  .addItem("Update active sheet", "updateActiveSheet")
  .addItem("Update selection", "updateActiveRange")
  .addSeparator()
  .addSubMenu(SpreadsheetApp.getUi().createMenu('Setup')
              .addItem("Activate edit trigger", "createSpreadsheetEditTrigger")
              .addItem("Deactivate edit trigger", "removeSpreadsheetEditTrigger")
              .addItem("Set # of header rows to ignore…", "promptHeaderRows")
              .addItem("Set bugzilla columns…", "promptBugColumns")
              .addItem("Set watch column…", "promptWatchColumn")
              .addItem("Set reciepient email…", "promptRecipientEmail")
              .addItem("Set email title…", "promptEmailTitle")
              .addItem("View current settings…", "viewSettings")
             ).addToUi();
};

function loadSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var documentProperties = PropertiesService.getDocumentProperties();
  var settings = Object.keys(SETTINGS);
  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];
    Logger.log("Loading " + setting);
    var value = documentProperties.getProperty(setting);
    Logger.log("value: " + value);
    if (value) {
        if ( setting == "RECIPIENT_EMAIL" ||setting == "RECIPIENT_EMAIL_TITLE") {
            SETTINGS[setting] = value;
        }
        else if (setting == "BUG_COLUMNS") {
        SETTINGS[setting] = value.trim().split(",");
      } else {
        SETTINGS[setting] = parseInt(value);
      }
    }
  }

  var triggers = ScriptApp.getUserTriggers(ss);
  Logger.log(triggers);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() != ScriptApp.EventType.ON_EDIT) {
      continue;
    }
    SETTINGS["TRIGGER_ON_EDIT"] = triggers[i].getUniqueId();
  }
}

function viewSettings() {
  loadSettings();
  var settings = Object.keys(SETTINGS);
  var output = "";
  for (var i = 0; i < settings.length; i++) {
    var setting = settings[i];
    output += setting + ": " + SETTINGS[setting] + "\n";
  }
  SpreadsheetApp.getUi().alert(output);
}

function promptBugColumns() {
  return promptSetting("BUG_COLUMNS", "Bugzilla columns to display",
                       "Enter an ordered, comma-separated list of Bugzilla REST API fields to display.\n" +
                       "Advanced examples: cf_status_firefox44, flags:qe-verify:status, flags:firefox-backlog:setter, flags:sec-review\n" +
                       "Special non-Bugzilla supported values: type, qe-verify (also looks in whiteboards for [qa…]), nickname:assigned_to_detail");
}

function promptWatchColumn() {
  return promptSetting("BUG_ID_COLUMN", "Bug ID watch column",
                       "Enter the column number (e.g. 1=A, 2=B, 3=C, etc.) to watch for bug IDs.\n" +
                       "Fetched data will be displayed in columns to the right of this (overwriting existing values).\n" +
                       "Note: this applies to the whole document, not just the active sheet");
}

function promptHeaderRows() {
  return promptSetting("HEADER_ROWS", "Number of header rows to ignore",
                       "Enter the number of header rows at the top of the sheet to ignore:");
}

function promptRecipientEmail() {
    return promptSetting("RECIPIENT_EMAIL", "Email address to which the email will be sent",
        "Enter the email address to which the email will be sent after the batch is complete");
}

function promptEmailTitle() {
    return promptSetting("RECIPIENT_EMAIL_TITLE", "Email custom title",
        "Enter the custom title for the email that will be sent after the batch is complete");
}

function promptSetting(key, title, description) {
  var ui = SpreadsheetApp.getUi();
  var documentProperties = PropertiesService.getDocumentProperties();
  var defaultValue = SETTINGS[key];
  loadSettings();
  var currentValue = SETTINGS[key];
  
  var message = description + "\n\n" +
    "Default value: " + defaultValue + "\n" +
    "Current value: " + currentValue + "\n";

  
  var result = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);

  // Process the user's response.
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    Logger.log("Setting " + key + " to " + text);
    documentProperties.setProperty(key, text);
    SETTINGS[key] = text;
    Logger.log(SETTINGS[key]);
  }
}


function _test() {
  var bug = new Bug(35);
  bug.fetch(SETTINGS.BUG_COLUMNS.concat(SETTINGS.ADDITIONAL_FETCHED_FIELDS));
}