/**
 * Checks the channel sheets for updates.
 */
function checkChannels() {

  const channelSheet = SpreadsheetApp.getActiveSheet();
  const formSheet = SpreadsheetApp.openById("1rKis0NkF_v5YLzveQ1e1MQMbDgjTpRUPkIdk-6PB12Q").getSheetByName("Channels");

  // Check for new channel submissions
  // Each form sheet row is in the form [timestamp, id(s), accepted, added]

  const channelSubmissions = HighQualityUtils.getSheetValues(formSheet);
  let index = channelSubmissions.length;

  // While submission has not been added
  while (--index >= 0 && !channelSubmissions[index][3]) {
    // If submission has not been accepted
    if (!channelSubmissions[index][2]) {
      continue;
    }

    const channelIds = channelSubmissions[index][1].replace(/.*channel\/|\?.*|\s/g, "").split(",");
    const channels = HighQualityUtils.getChannels(channelIds);

    if (channels) {
      HighQualityUtils.addToSheet(channelSheet, channels);
      formSheet.getRange(index + 2, 3, 1, 2).setValue(true);
      Logger.log("Added " + channels.length + " out of " + channelIds.length + " channels!");
    } else {
      formSheet.getRange(index + 2, 3, 1, 2).setValue(false);
      Logger.log("Failed to add " + channelIds.length + " channels!");
    }
  }

  HighQualityUtils.sortSheet(channelSheet, 2, true);

  // TODO
  // - Get all channel IDs
  // - List all channels
  // - Loop through the channels
  // - Compare old values to new ones
  // - Update changelog sheet as needed
  // - Update channel sheet as needed

}
