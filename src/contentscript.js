(() => {
    const STORAGE_KEY = "volume";
    const LOOP_DELAY = 500;

    const storage = (chrome ?? browser).storage;
    const runtime = (chrome ?? browser).runtime;

    let runtimePort = runtime.connect();
    runtimePort.onDisconnect.addListener(() => {
        runtimePort = undefined;
    });

    /**
     * Write console logs only when extension is loaded as unpacked
     */
    function debug() {
        const manifest = runtime.getManifest();
        if ("update_url" in manifest) {
            return;
        }

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
            if (data?.[hostStorageKey] === null) {
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
                        ...frame.contentDocument.querySelectorAll(
                            "video, audio",
                        ),
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
                tag.volume = data[hostStorageKey] / 100;
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
