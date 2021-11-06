/**
 * Deletes and recreates project triggers.
 */
function resetTriggers() {

  const triggers = ScriptApp.getProjectTriggers();
  
  for (var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  ScriptApp.newTrigger('checkChannels')
    .timeBased()
    .everyHours(1)
    .create();

}
