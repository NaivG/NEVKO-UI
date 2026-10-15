// Forced Steam settings, written straight to Steam (no Settings window needed): on launch, and kept in step
// with the Chat Area option afterwards. Their rows are hidden in the Settings window by Force Disable Settings.js.
// Both always run (skin.json, Patches)

;(() => {
  "use strict"

  // The Chat Area option of the theme decides where chats open (its value comes in a variable from the option's CSS):
  // nothing / "always" - chats stay docked to the friends list; "auto" - docked too (the theme folds the chat area
  // away while the window is narrow); "off" - the friends window keeps its list alone, every chat opens in its own window
  function chatsInOwnWindows() {
    try {
      return getComputedStyle(document.documentElement).getPropertyValue("--nk-chat-area").trim() === "off"
    } catch {
      return false
    }
  }

  // Friends & Chat
  const FRIENDS = {
    bCompactFriendsList: false,
    bCompactQuickAccess: false,
  }

  // Library, Accessibility
  const CLIENT = {
    library_display_icon_in_game_list: true,
    ready_to_play_includes_streaming:  false,
    accessibility_high_contrast_mode:  false,
    accessibility_reduce_motion:       false,
  }

  const RETRY_EVERY = 500 // ms, settings load after login
  const WATCH_EVERY = 2000 // ms: the Chat Area option can be changed while Steam runs
  const MAX_TRIES = 120

  const shared = window.opener
  if (!shared) return

  const loaded = object => !!object && Object.keys(object).length > 0

  function apply() {
    const store = shared.settingsStore
    const friends = store?.friendSettings
    if (!loaded(friends) || !loaded(store.clientSettings)) return false

    // The third switch of the option (the docked chat itself: below)
    const wanted = { ...FRIENDS, bAlwaysNewChatWindow: chatsInOwnWindows() }
    const changed = Object.entries(wanted).filter(([name, value]) => name in friends && friends[name] !== value)
    if (changed.length) store.UpdateFriendSettings({ ...friends, ...Object.fromEntries(changed) })

    for (const [name, value] of Object.entries(CLIENT)) {
      const [current, set] = store.GetClientSetting(name)
      if (current !== undefined && current !== value) set(value)
    }

    // The same message the switch in the Settings window sends: Steam moves the open chats itself
    const dock = !chatsInOwnWindows()
    const docked = shared.g_FriendsUIApp?.SettingsStore?.BSingleWindowModeEnabled?.()
    if (docked !== undefined && docked !== dock) {
      shared.SteamClient.Messaging.PostMessage("LibraryCommands", "ToggleDockedMode", JSON.stringify({ checked: dock }))
    }
    return true
  }

  // __nk_drs_ready: set by Force Disable Settings.js in this window
  let tries = 0
  let watching = false
  function run() {
    let applied = false
    try { applied = window.__nk_drs_ready && apply() } catch {}
    if (applied) {
      // Kept in step with the option afterwards: a change of it moves the chats at once, not on the next launch
      if (!watching) {
        watching = true
        setInterval(run, WATCH_EVERY)
      }
      return
    }
    if (!watching && ++tries < MAX_TRIES) setTimeout(run, RETRY_EVERY)
  }

  run()
})()
