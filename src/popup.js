const STORAGE_KEY = "volume";
const DEFAULT_VOLUME = 100;

const storage = (chrome ?? browser).storage;
const tabs = (chrome ?? browser).tabs;

document.addEventListener("DOMContentLoaded", function () {
    let host = "";

    const websiteSlider = document.querySelector("#website-slider");
    websiteSlider.value = DEFAULT_VOLUME;

    const status = document.querySelector("#status");
    const statusLabel = document.querySelector("#status-label");
    const websiteText = document.querySelector("#volume-value-label");

    const setVolumeLabel = function (volume) {
        websiteText.textContent = `${volume}%`;
    };

    let currentTab;

    tabs.query({
        active: true,
        currentWindow: true,
        url: ["http://*/*", "https://*/*"]
    }, function (tabs) {
        currentTab = tabs?.[0];

        if (!currentTab) {
            statusLabel.textContent = "Unsupported scheme";
            status.indeterminate = true;
            status.disabled = true;
            status.checked = false;
            websiteSlider.disabled = true;
            return;
        }

        host = parseHostFromURL(currentTab.url);
        const hostStorageKey = `${STORAGE_KEY}_${host}`;
        storage.local.get([hostStorageKey], (data) => {
            const hostStatus = data?.[hostStorageKey] !== null;
            status.checked = hostStatus;
            websiteSlider.disabled = !hostStatus;
            setStatusLabel(!hostStatus, host);

            let volume = data?.[hostStorageKey];
            if (isNaN(volume)) {
                volume = DEFAULT_VOLUME;
            }

            websiteSlider.value = volume;
            setVolumeLabel(volume);
        });
    });

    websiteSlider.addEventListener("input", () => {
        const val = websiteSlider.valueAsNumber;

        const settings = {
            [`${STORAGE_KEY}_${host}`]: val,
        };

        storage.local.set(settings, function () {
            setVolumeLabel(val);
            tabs.sendMessage(currentTab.id, true);
        });
    });

    status.addEventListener("input", () => {
        const enabled = status.checked;
        const hostStorageKey = `${STORAGE_KEY}_${host}`;
        websiteSlider.disabled = !enabled;

        if (enabled) {
            const settings = {
                [hostStorageKey]: websiteSlider.valueAsNumber,
            };

            storage.local.set(settings, () => {
                setStatusLabel(!enabled, host);
                tabs.sendMessage(currentTab.id, true);
            });
        } else {
            websiteSlider.value = DEFAULT_VOLUME;
            setVolumeLabel(DEFAULT_VOLUME);
            storage.local.remove([hostStatusKey, hostStorageKey], () => { });
        }
    });

    function parseHostFromURL(url) {
        const u = new URL(url);
        return u.host;
    }

    function setStatusLabel(disabled, host) {
        statusLabel.textContent = disabled
            ? `Disabled for ${host}`
            : `Enabled for ${host}`;
    }
});
