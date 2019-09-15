/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Original author: MattN

/* exported lookForBugNumberChange */
/* global Bug, editTrigger, isValidBugNumber, loadSettings, SETTINGS */

function lookForBugNumberChange(e) {
  loadSettings();
  var range = e.range;
  // e.value if only one cell modified but not when pasting :(
  Logger.log(range.getValue());
  Logger.log(isValidBugNumber(range.getValue()));
  Logger.log(range.getColumn());
  Logger.log(range.getA1Notation());
  Logger.log("column: " + SETTINGS.BUG_ID_COLUMN);

  // TODO: Set a comment on the edited cell to indicate when it was changed.
  //range.setNote('Last modified: ' + new Date());

  clearGeneratedFormatting(range);

  for (var col = range.getColumn(); col < range.getColumn() + range.getWidth(); col++) {
    if (col != SETTINGS.BUG_ID_COLUMN) {
      continue;
    }
    for (var row = range.getRow(); row < range.getRow() + range.getHeight(); row++) {
      var idRange = range.getSheet().getRange(row, col);
      if (!isValidBugNumber(idRange.getValue())) {
        continue;
      }
      updateRowWithBug(idRange.getValue(), idRange);
    }
  }
}

function updateRowWithBug(id, idRange) {
  if (idRange.getWidth() > 1 || idRange.getHeight() > 1) {
    throw new Error("Invalid range to update bug");
  }

  if (idRange.getRow() <= SETTINGS.HEADER_ROWS) {
    return;
  }

  var bug = new Bug(id);
  var cleansedColumns = SETTINGS.BUG_COLUMNS.map(function(val) {
    var field = val.trim();
    if (field.indexOf("flags:") === 0) {
      return "flags";
    }
    return field.replace(/^nickname:/, "").replace(/^(assigned_to|creator)_detail$/, "$1");
  });
  var result = bug.fetch(cleansedColumns.concat(SETTINGS.ADDITIONAL_FETCHED_FIELDS));
  if (!result) {
    idRange.setNote(bug.error);
    return;
  }
  idRange.clearNote();
  var toUpdate = idRange.offset(0, 1, 1, SETTINGS.BUG_COLUMNS.length);
  Logger.log("len: " + SETTINGS.BUG_COLUMNS.length);
  // TODO: batch the writing to the cells
  for (var x = 0; x < SETTINGS.BUG_COLUMNS.length; x++){
    var column = SETTINGS.BUG_COLUMNS[x].trim();
    var flagName = undefined, flagProp = undefined;
    Logger.log(column);
    if (column.indexOf("flags:") === 0) {
      var components = column.split(":");
      column = components[0];
      flagName = components[1];
      flagProp = components[2];
    }
    var cell = toUpdate.getCell(1, x + 1);
    if (result) {
      var val = undefined;
      try {
        // Assume the BMO field name matches the column type and then override here when it's not or to provide better formatting.
        switch (column) {
          case "flags":
            val = bug.getFlag(flagName, flagProp);
            break;
          case "qe-verify":
            val = bug.getQEVerify();
            break;
          case "status":
            val = bug.getStatus();
            break;
          case "summary":
            val = bug.getSummaryLink();
            break;
          case "type":
            val = bug.getType();
            break;
          default:
            if (column.indexOf("nickname:") === 0) {
              val = bug.getUserNickname(column.replace(/^nickname:/, ""));
            } else {
              val = bug.getField(column);
            }
            break;
        }
      } catch (ex) {
        Logger.log("Error getting column value: " + ex); 
      }
      if (typeof(val) !== "undefined") {
        cell.setValue(val);
      }
    } else {
      cell.setValue(""); 
    }
  }
  toUpdate.setBackground("#fff2cc"); // TODO: add setting
}

/* eslint-disable-next-line no-unused-vars */
function updateActiveRange() {
  loadSettings();
  var sheet = SpreadsheetApp.getActiveSheet();
  var e = {
    range: sheet.getActiveRange(),
  };
  editTrigger(e);
}

/* eslint-disable-next-line no-unused-vars */
function updateActiveSheet() {
  loadSettings();
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  for (var y = SETTINGS.HEADER_ROWS + 1; y <= lastRow; y++){
    var range = sheet.getRange(y, SETTINGS.BUG_ID_COLUMN);
    var val = range.getValue();
    if (!isValidBugNumber(val)) {
      continue;
    }
    updateRowWithBug(val, range);
  }
}

function clearGeneratedFormatting(range) {
  // TODO: maybe clearNote on bug ID column?
  var maxGeneratedColumn = SETTINGS.BUG_ID_COLUMN + SETTINGS.BUG_COLUMNS.length;
  if (range.getColumn() > maxGeneratedColumn ||
      range.getLastColumn() < SETTINGS.BUG_ID_COLUMN ||
      range.getLastRow() <= SETTINGS.HEADER_ROWS) {
    return;
  }

  Logger.log("range: %s %s / %s", range.getRow(), range.getColumn(), SETTINGS.BUG_ID_COLUMN + 1);
  var offsetY = Math.max(range.getRow(), SETTINGS.HEADER_ROWS + 1) - range.getRow();
  var offsetX = Math.max(SETTINGS.BUG_ID_COLUMN + 1, range.getColumn()) - range.getColumn();
  var numRows = range.getHeight() - offsetY;
  var numCols = Math.min(range.getWidth(), maxGeneratedColumn - range.getColumn() + 1) - offsetX;
  if (!numCols) {
    return;
  }
  Logger.log('offset: %s %s %s %s', offsetY, offsetX, numRows, numCols);
  var generatedSubset = range.offset(offsetY, offsetX, numRows, numCols);
  Logger.log(generatedSubset.getA1Notation());
  generatedSubset.setBackground("");
}
