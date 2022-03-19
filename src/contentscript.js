(() => {
  const STORAGE_KEY = "volume";
  const LOOP_DELAY = 500;

  const storage = (chrome ?? browser).storage;
  const runtime = (chrome ?? browser).runtime;

  // Enable or disable debug output
  // Use `chrome.storage.local.set({ debug: true })` to enable debug
  let debugAllowed = false;
  chrome.storage.local.get("debug", ({ debug }) => (debugAllowed = !!debug));

  // Workaround for "Extension context invalidated" error
  let runtimePort = runtime.connect();
  runtimePort.onDisconnect.addListener(() => {
    runtimePort = undefined;
  });

  /**
   * Write console logs only when extension is loaded as unpacked
   */
  function debug() {
    if (!debugAllowed) {
      return;
    }

    const manifest = runtime.getManifest();

    const prefix = `[${manifest.name}]`;

    console.log(prefix, ...arguments);
  }

  runtimePort.onMessage.addListener(() => {
    setVolume();
  });

  function setVolume() {
    const host = window.location.host;
    const hostStorageKey = `${STORAGE_KEY}_${host}`;

    // Fix for 'Extension context invalidated' error.
    if (!runtime?.id) return;

    storage.local.get([hostStorageKey], (data) => {
      debug("Got settings:", { ...data });

      // Check if extension is enabled for current host
      if (data?.[hostStorageKey] === undefined) {
        debug("Not enabled for this host", host);
        return;
      }

      // Collecting video elements from main document
      let videoElements = [...document.querySelectorAll("video, audio")];

      // Collecting video elements from iframes
      [...document.getElementsByTagName("iframe")]
        .filter((frame) => frame.contentDocument)
        .forEach((frame) => {
          videoElements = videoElements.concat([
            ...frame.contentDocument.querySelectorAll("video, audio"),
          ]);
        });

      // Check if there are video elements
      if (videoElements.length === 0) {
        debug("No video elements found");
        // Restart loop
        setTimeout(() => start(), LOOP_DELAY);
        return;
      }

      // Apply volume for all video elements
      videoElements.forEach((tag) => {
        // Using power of 2 scale for volume
        tag.volume = Math.pow(data[hostStorageKey] / 100, 2);
      });

      // Restart loop
      setTimeout(() => start(), LOOP_DELAY);
    });
  }

  function start() {
    window.requestAnimationFrame(() => {
      setVolume();
    });
  }

  start();
})();
