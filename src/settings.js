const STORAGE_KEY = "volume";
const DEFAULT_VOLUME = 100;

const storage = (chrome ?? browser).storage;
const tabs = (chrome ?? browser).tabs;
const runtime = (chrome ?? browser).runtime;

function setTitle() {
  const el = document.querySelector("#extension-title");
  const title = runtime.getManifest().name;
  el.textContent = title;
  document.title = title;
}

/**
 * Normalize File Name
 *
 * @param {string} name
 * @returns {string}
 */
function normalizeFileName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\d]+/gim, "_");
}

function filterOnlyVolumeEntries([key]) {
  return key.startsWith(`${STORAGE_KEY}_`);
}

function loadSites() {
  const sitesList = document.querySelector("#sites-list");

  storage.local.get((data) => {
    Object.entries(data)
      .filter(filterOnlyVolumeEntries)
      .forEach(([key, val]) => {
        const site = key.replace(`${STORAGE_KEY}_`, "");
        const btnRemove = document.createElement("button");
        const siteWrapper = document.createElement("dt");
        const labelSite = document.createElement("span");
        const labelVolume = document.createElement("dd");

        labelSite.textContent = site;
        labelVolume.textContent = `${val}%`;

        btnRemove.innerHTML = "&times;";
        btnRemove.type = "button";
        btnRemove.title = "Remove";
        btnRemove.addEventListener("click", async () => {
          await storage.local.remove(key);
          siteWrapper.remove();
          labelVolume.remove();
        });

        siteWrapper.append(btnRemove, labelSite);

        sitesList.append(siteWrapper, labelVolume);
      });
  });
}

async function clearAllSites() {
  const data = await storage.local.get();
  const sites = Object.entries(data).filter(filterOnlyVolumeEntries).map(([key]) => key);
  return await storage.local.remove(sites);
}

async function clearButtonHandler() {
  const result = confirm("Are you sure you want to delete ALL saved sites?");
  if (!result) return;

  await clearAllSites();
  location.reload();
}

const filePickerTypes = [
  {
    description: "Extension options (JSON)",
    accept: { "application/json": [".json"] },
  },
];

async function exportButtonHandler() {
  const fileHandle = await window.showSaveFilePicker({
    startIn: "downloads",
    suggestedName: normalizeFileName(runtime.getManifest().name),
    types: filePickerTypes,
  });

  const writable = await fileHandle.createWritable();

  const storageData = await storage.local.get();

  const contents = JSON.stringify(
    Object.fromEntries(
      Object.entries(storageData).filter(([key]) =>
        key.startsWith(`${STORAGE_KEY}_`),
      ),
    ),
    null,
    2,
  );

  await writable.write(contents);
  await writable.close();
}

async function parseJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    throw e;
  }
}

async function importButtonHandler() {
  const [fileHandle] = await window.showOpenFilePicker({
    startIn: "downloads",
    types: filePickerTypes,
  });
  const file = await fileHandle.getFile();
  const contents = await file.text();
  const json = await parseJson(contents).catch(() => { });

  if (json === undefined) {
    return alert("Malformed file");
  }

  await storage.local.set(
    Object.fromEntries(
      Object.entries(json)
        .filter(filterOnlyVolumeEntries)
        .filter(([_, val]) => val >= 0 && val <= 100),
    ),
  );

  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  setTitle();
  loadSites();

  document
    .querySelector("#import-button")
    .addEventListener("click", importButtonHandler);

  document
    .querySelector("#export-button")
    .addEventListener("click", exportButtonHandler);

  document
    .querySelector("#clear-button")
    .addEventListener("click", clearButtonHandler);
});
