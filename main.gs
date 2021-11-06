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

    const channelIds = channelSubmissions[index][1].replace(/ /g, "").split(",");

    channelIds.forEach((channelId) => {
      const channelData = HighQualityUtils.getChannel(channelId);

      if (channelData) {
        HighQualityUtils.insertRow(channelSheet, channelData);
      }
    });
  }

  HighQualityUtils.sortSheet(channelSheet, 2, true);

  // TODO
  // - Get up to 50 channel IDs
  // - List all 50 channels
  // - Loop through the channels
  // - Compare old values to new ones
  // - Update changelog sheet as needed
  // - Update channel sheet as needed

}
