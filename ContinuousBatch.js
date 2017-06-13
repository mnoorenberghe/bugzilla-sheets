/**
 * Created by silviu.checherita on 6/13/2017.
 */

function startOrResumeContinousBatch(funcName){
    var userProperties = PropertiesService.getUserProperties();
    var start = userProperties.getProperty(funcName + '_START_BATCH');
    if (start === "" || start === null)
    {
        start = new Date();
        userProperties.setProperty(funcName + '_START_BATCH', start);
        userProperties.setProperty(funcName + '_KEY', "");
    }

    userProperties.setProperty(funcName + '_START_ITERATION', new Date());

    deleteCurrentTrigger(funcName);
    enableNextTrigger(funcName);
}

function getBatchKey(funcName){
    var userProperties = PropertiesService.getUserProperties();
    return userProperties.getProperty(funcName + '_KEY');
}

function setBatchKey(funcName, key){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(funcName + '_KEY', key);
}

function endContinuousBatch(funcName, emailRecipient, customTitle){
    var userProperties = PropertiesService.getUserProperties();
    var end = new Date();
    var start = userProperties.getProperty(funcName + '_START_BATCH');
    var key = userProperties.getProperty(funcName + '_KEY');

    if (emailRecipient != "") {
        var emailTitle = customTitle + " : Continuous Execution Script for " + funcName;
        var body = "Started at : " + start + "<br>" + "Ended at : " + end + "<br>" + "LAST KEY : " + key;
        MailApp.sendEmail(emailRecipient, emailTitle, "", {htmlBody:body});
    }

    deleteCurrentTrigger(funcName);
    userProperties.deleteProperty(funcName + '_START_ITERATION');
    userProperties.deleteProperty(funcName + '_START_BATCH');
    userProperties.deleteProperty(funcName + '_KEY');
    userProperties.deleteProperty(funcName);
}

function enableNextTrigger(funcName) {
    var userProperties = PropertiesService.getUserProperties();
    var nextTrigger = ScriptApp.newTrigger(funcName).timeBased().after(6 * 60 * 1000).create();
    var triggerId = nextTrigger.getUniqueId();

    userProperties.setProperty(funcName, triggerId);
}

function deleteCurrentTrigger(funcName) {
    var userProperties = PropertiesService.getUserProperties();
    var triggerId = userProperties.getProperty(funcName);
    var triggers = ScriptApp.getProjectTriggers();
    for (var i in triggers) {
        if (triggers[i].getUniqueId() === triggerId)
            ScriptApp.deleteTrigger(triggers[i]);
    }
    userProperties.setProperty(funcName, "");
}

function isTimeRunningOut(funcName){
    var userProperties = PropertiesService.getUserProperties();
    var start = new Date(userProperties.getProperty(funcName + '_START_ITERATION'));
    var now = new Date();

    var timeElapsed = Math.floor((now.getTime() - start.getTime())/1000);
    return (timeElapsed > 340);
}