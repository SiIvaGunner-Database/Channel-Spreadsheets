/**
 * Update the channel database and sheets.
 */
function updateChannels() {
  const channelSpreadsheetId = "16PLJOqdZOdLXguKmUlUwZfu-1rVXzuJLHbY18BUSOAw"
  const channelSpreadsheet = HighQualityUtils.spreadsheets().getById(channelSpreadsheetId)
  const channelSheet = channelSpreadsheet.getSheet("Channels")
  const changelogSheet = channelSpreadsheet.getSheet("Changelog")
  const channels = HighQualityUtils.channels().getAll()
  const channelsToUpdate = []
  const channelValues = []
  const changelogValues = []

  // Check for updates on each channel
  channels.forEach(channel => {
    const channelHyperlink = HighQualityUtils.utils().formatYoutubeHyperlink(channel.getId())
    console.log(channel.getDatabaseObject().title)

    // If any YouTube metadata has changed
    if (channel.hasChanges() === true) {
      const changes = channel.getChanges()
      const loggedFields = ["title", "description"]
      console.log(changes)

      // Add specified fields to the changelog sheet
      changes.forEach(change => {
        if (loggedFields.includes(change.key) === true) {
          console.log(`New ${change.key}: ${change.value}`)
          changelogValues.push([
            channelHyperlink,
            channel.getDatabaseObject().title,
            change.message,
            change.timestamp
          ])
        }
      })
    }

    const currentStatus = channel.getYoutubeStatus()

    // If the YouTube status has changed
    if (channel.getDatabaseObject().youtubeStatus !== currentStatus) {
      console.log(`New status: ${currentStatus}`)
      changelogValues.push([
        channelHyperlink,
        channel.getDatabaseObject().title,
        change.message,
        HighQualityUtils.utils().formatDate()
      ])
    }

    // If there were any changes
    if (channel.hasChanges() === true || channel.getDatabaseObject().youtubeStatus !== currentStatus) {
      channelsToUpdate.push(channel)
    }

    channelValues.push([
      channelHyperlink,
      channel.getSpreadsheetHyperlink(),
      channel.getDatabaseObject().title,
      channel.getWikiHyperlink(),
      channel.getDatabaseObject().youtubeStatus,
      channel.getDatabaseObject().publishedAt,
      channel.getDatabaseObject().description,
      channel.getDatabaseObject().videoCount,
      channel.getDatabaseObject().subscriberCount,
      channel.getDatabaseObject().viewCount
    ])
  })

  // Push the updates to the database, channel sheet, and changelog sheet
  HighQualityUtils.channels().updateAll(channelsToUpdate)
  channelSheet.updateValues(channelValues)
  changelogSheet.insertValues(changelogValues)
}

/**
 * Delete and recreate project triggers.
 */
function resetTriggers() {
  HighQualityUtils.settings().deleteTriggers()
  ScriptApp.newTrigger('updateChannels')
    .timeBased()
    .everyHours(12)
    .create()
}
