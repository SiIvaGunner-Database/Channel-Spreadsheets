// IMPORTANT! Enable dev mode when testing.
// HighQualityUtils.settings().enableDevMode()
HighQualityUtils.settings().setAuthToken(ScriptProperties)

/**
 * Update the channel database and sheets.
 */
function updateChannels() {
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

      // Add specified fields to the changelog sheet
      changes.forEach(change => {
        console.log(change.message)

        if (loggedFields.includes(change.key) === true) {
          changelogValues.push([
            channelHyperlink,
            channel.getDatabaseObject().title,
            change.label,
            change.oldValue,
            change.newValue,
            change.timestamp
          ])
        }
      })
    }

    const oldStatus = channel.getDatabaseObject().channelStatus
    const currentStatus = channel.getYoutubeStatus()

    // If the YouTube status has changed
    if (oldStatus !== currentStatus) {
      console.log(`Old status: ${oldStatus}\nNew status: ${currentStatus}`)
      channel.getDatabaseObject().channelStatus = currentStatus
      changelogValues.push([
        channelHyperlink,
        channel.getDatabaseObject().title,
        "Status",
        oldStatus,
        currentStatus,
        HighQualityUtils.utils().formatDate()
      ])
    }

    // If there were any changes
    if (channel.hasChanges() === true || oldStatus !== currentStatus) {
      channelsToUpdate.push(channel)
    }

    channelValues.push([
      channelHyperlink,
      channel.getSpreadsheetHyperlink(),
      channel.getDatabaseObject().title,
      channel.getWikiHyperlink(),
      channel.getDatabaseObject().channelStatus,
      channel.getDatabaseObject().publishedAt,
      channel.getDatabaseObject().description,
      channel.getDatabaseObject().videoCount,
      channel.getDatabaseObject().subscriberCount,
      channel.getDatabaseObject().viewCount
    ])
  })

  const channelSpreadsheetId = (
    HighQualityUtils.settings().isDevModeEnabled() === true // if dev mode
    ? "1EDz_beMzXpxv8CpRhEu_GhcYCbT6EOP4JBDw93XoGdU" // then development
    : "16PLJOqdZOdLXguKmUlUwZfu-1rVXzuJLHbY18BUSOAw" // else production
  )
  const channelSpreadsheet = HighQualityUtils.spreadsheets().getById(channelSpreadsheetId)
  const channelSheet = channelSpreadsheet.getSheet("Channels")
  const changelogSheet = channelSpreadsheet.getSheet("Changelog")

  // Push the updates to the database, channel sheet, and changelog sheet
  changelogSheet.insertValues(changelogValues)
  changelogSheet.sort(6, false)
  channelSheet.updateValues(channelValues)
  channelSheet.sort(3)
  HighQualityUtils.channels().updateAll(channelsToUpdate)
}

/**
 * Delete and recreate project triggers.
 */
function resetTriggers() {
  HighQualityUtils.settings().deleteTriggers()
  ScriptApp.newTrigger("updateChannels").timeBased().everyHours(12).create()
}
