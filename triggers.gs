/**
 * Deletes and recreates project triggers.
 */
function resetTriggers() {
  const triggers = ScriptApp.getProjectTriggers()

  for (let i in triggers) {
    ScriptApp.deleteTrigger(triggers[i])
  }

  ScriptApp.newTrigger('updateChannels')
    .timeBased()
    .everyHours(12)
    .create()
}
