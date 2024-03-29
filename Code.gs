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
          if (change.key === "title") {
            applyTitleChange(channel, change)
          }

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

      if (currentStatus === "Deleted") {
        updateAllVideoStatuses(channel, "Deleted")
      }
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
 * Send an email notification of the title change and update references to the title in the channel's rip sheet.
 * @param {Channel} channel - The channel object.
 * @param {Object} change - The title change object returned in channel.getChanges().
 */
function applyTitleChange(channel, change) {
  // Send an email notification
  const emailAddress = "a.k.zamboni@gmail.com";
  const subject = "Channel Renamed: " + change.newValue;
  const message = "A channel [" + channel.getId() + "] has been renamed.\n\n" + change.message;
  MailApp.sendEmail(emailAddress, subject, message);

  // Update the channel's rips sheet name and find the title hyperlink on the index sheet
  const ripsSheet = channel.getSheet().getOriginalObject().setName(change.newValue)
  const indexSheet = ripsSheet.getParent().getSheetByName("Index")
  const textFinder = indexSheet.createTextFinder(change.oldValue)

  while (textFinder.findNext() !== null) {
    const hyperlinkRange = textFinder.getCurrentMatch()
    const hyperlinkFormula = hyperlinkRange.getFormula()

    // If the title hyperlink is found, update it with the new title
    if (hyperlinkFormula.startsWith("=HYPERLINK") === true) {
      const newFormula = hyperlinkFormula.replace(change.oldValue, change.newValue)
      hyperlinkRange.setFormula(newFormula)
    }
  }
}

/**
 * Update all channel video statuses to a given value.
 * Useful for when a channel is deleted and all of their videos are deleted at once.
 * @param {Channel} channel - The channel object.
 * @param {String} newVideoStatus - The video status to set.
 */
function updateAllVideoStatuses(channel, newVideoStatus) {
  HighQualityUtils.settings().disableYoutubeApi()

  const videosToUpdate = []
  const videoOptions = { "parameters": { "fields": "id,videoStatus" } }

  channel.getVideos(videoOptions)[0].forEach(video => {
    if (video.getDatabaseObject().videoStatus !== newVideoStatus) {
      video.getDatabaseObject().videoStatus = newVideoStatus
      videosToUpdate.push(video)
    }
  })

  if (videosToUpdate.length > 0) {
    console.log(`Updating ${videosToUpdate.length} videos status for channel with ID ${channel.getId()}`)
    const range = channel.getSheet().getOriginalObject().getRange("D2:D")
    const newStatuses = range.getValues().map(value => ["Deleted"])
    range.setValues(newStatuses)
    HighQualityUtils.videos().updateAll(videosToUpdate)
  }

  HighQualityUtils.settings().enableYoutubeApi()
}
