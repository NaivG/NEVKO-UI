// Option "Chat Area: Auto Hide" - the chat beside the friends list folds away while the window cannot hold it
// The list and the chat keep CHAT_MIN together (as in Chat.js and Chat.css); the width of the list is Steam's own,
// written on the element on every step of the drag. No room left = the chat goes (styles: Chat Area Auto Hide.css)
// A chat that is open takes the whole window: the messages are never hidden, only the list

;(() => {
  "use strict"

  const FRIENDS = ".chat_main.singlewindow .friendsListContainer" // the friends window (a chat window has no list beside it)
  const NARROW = "nk-chat-narrow" // on <html>: what the styles of the option answer to
  const CHAT_MIN = 400 // px, the least width the chat keeps (as in Chat.js and Chat.css)
  const DIVIDER = 6 // px of the divider between the list and the chat
  const CHECK_EVERY = 700 // ms: the option, the list and the window change without events of their own

  const root = document.documentElement
  const mode = () => getComputedStyle(root).getPropertyValue("--nk-chat-area").trim()
  let narrow = null // null before the first pass

  // The width the list is dragged to (Steam keeps it on the element); a folded list has none
  const widthOf = list => parseFloat(list.style.width) || list.getBoundingClientRect().width || 0

  let observer = null
  let observed = null

  // Every step of a drag writes the width on the list: watched, not waited for
  function watch(list) {
    if (!list || list === observed) return
    observed = list
    observer?.disconnect()
    observer = new MutationObserver(schedule)
    observer.observe(list, { attributes: true, attributeFilter: ["style"] })
  }

  function update() {
    const list = document.querySelector(FRIENDS)
    watch(list)
    const narrowNow = !!list && mode() === "auto" && innerWidth < widthOf(list) + CHAT_MIN + DIVIDER
    if (narrowNow === narrow) return
    narrow = narrowNow
    root.classList.toggle(NARROW, narrowNow)
  }

  let frame = null
  function schedule() {
    frame ??= requestAnimationFrame(() => {
      frame = null
      update()
    })
  }

  function init() {
    addEventListener("resize", schedule)
    setInterval(schedule, CHECK_EVERY)
    update()
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init()
})()
