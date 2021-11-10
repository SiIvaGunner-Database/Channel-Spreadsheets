/**
 * Checks the channel sheets for updates.
 */
function checkChannels() {

  const channelSheet = SpreadsheetApp.getActiveSheet();
  const channelChangelogSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Changelog");
  const formSheet = SpreadsheetApp.openById("1rKis0NkF_v5YLzveQ1e1MQMbDgjTpRUPkIdk-6PB12Q").getSheetByName("Channels");

  // Check for new channel submissions
  // Each form sheet row is in the format [timestamp, id(s), accepted, added]

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
    let message;

    if (channels) {
      HighQualityUtils.addToSheet(channelSheet, channels);
      formSheet.getRange(index + 2, 3, 1, 2).setValue(true);
      message = "Added " + channels.length + " out of " + channelIds.length + " channels!";
    } else {
      formSheet.getRange(index + 2, 3, 1, 2).setValue(false);
      message = "Failed to add " + channelIds.length + " channels!";
    }

    Logger.log(message);
    HighQualityUtils.logEvent(message);
  }

  HighQualityUtils.sortSheet(channelSheet, 5, true);
  HighQualityUtils.sortSheet(channelSheet, 2, true);

  // Loop through the channels on the sheet
  // Compare them to the corresponding YouTube channels

  const sheetChannels = HighQualityUtils.getSheetValues(channelSheet, "channel");
  const channelIds = sheetChannels.map(channel => channel.id);
  const ytChannels = HighQualityUtils.getChannels(channelIds)
    .sort((a, b) => a.joinDate.localeCompare(b.joinDate))
    .sort((a, b) => a.name.localeCompare(b.name));
  let ytIndex = 0;

  for (let sheetIndex in sheetChannels) {
    const sheetChannel = sheetChannels[sheetIndex];
    const ytChannel = ytChannels[ytIndex];
    const row = parseInt(sheetIndex) + 2;
    Logger.log("Updating row " + row + ": " + sheetChannel.name);
    let ytStatus = "Public";

    // If the video is not listed on YouTube
    if (sheetChannel.id != ytChannel.id) {
      ytStatus = "Deleted";
    } else {
      ytIndex++;

      if (sheetChannel.name != ytChannel.name) {
        HighQualityUtils.logToSheet();
        const ytHyperlink = HighQualityUtils.formatYouTubeHyperlink(sheetChannel.id);
        const change = "Old name: " + sheetChannel.name + "\nNew name: " + ytChannel.name;
        const logEntry = [[ ytHyperlink, ytChannel.name, change, new Date() ]];
        HighQualityUtils.addToSheet(channelChangelogSheet, logEntry);
        sheetChannel.name = ytChannel.name;
        Logger.log(change);
      }

      if (sheetChannel.description != ytChannel.description) {
        const ytHyperlink = HighQualityUtils.formatYouTubeHyperlink(sheetChannel.id);
        const change = "Old description: " + sheetChannel.description + "\nNew description: " + ytChannel.description;
        const logEntry = [[ ytHyperlink, sheetChannel.name, change, new Date() ]];
        HighQualityUtils.addToSheet(channelChangelogSheet, logEntry);
        sheetChannel.description = ytChannel.description;
        Logger.log(change);
      }

      sheetChannel.videoCount = ytChannel.videoCount;
      sheetChannel.subscriberCount = ytChannel.subscriberCount;
      sheetChannel.viewCount = ytChannel.viewCount;
    }

    if (sheetChannel.youtubeStatus != ytStatus) {
      const ytHyperlink = HighQualityUtils.formatYouTubeHyperlink(sheetChannel.id);
      const change = "Old status: " + sheetChannel.youtubeStatus + "\nNew status: " + ytStatus;
      const logEntry = [[ ytHyperlink, sheetChannel.name, change, new Date() ]];
      HighQualityUtils.addToSheet(channelChangelogSheet, logEntry);
      sheetChannel.youtubeStatus = ytStatus;
      Logger.log(change);
    }

    sheetChannel.id = HighQualityUtils.formatYouTubeHyperlink(sheetChannel.id);
    HighQualityUtils.updateInSheet(channelSheet, sheetChannel, row);
  }

}
