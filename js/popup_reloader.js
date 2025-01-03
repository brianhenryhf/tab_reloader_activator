import { getCurrentTab } from './utils.js';
import { logToUi, DEV_MODE } from './dev_utils.js';

//  based on a tab id that's only good for a session. and you can re-get tabs by it.

// TODO - some other indicator of reloading state (and maybe a way to see all running alarms. at least for dev/debug purposes). oh, can see in console.
  // but also see all tabs in current window maybe. so i can tell what tab id is what.
// useful snippets for console
// await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT})

// for (const { id,  url } of await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT})) {
//   console.log(`Name: ${id}, url: ${url}`);
// }

// note - well, i guess duh, but reloading a tab doesn't stop it from reloading (alarm is still active, tab id is not changed)
// surprising tho - if i close and paste url i a new tab, this is still reloading..
// TODO RECONFIRM

//TODO - perhaps some kind of reload countdown? - in badge text or when popup is open? or at least some reload imminent badge background change in last 10 seconds?

// TODO prolly makes sense to not allow no-discard and popup at same time. hard to show on badge if both in effect...

// TODO rectify approach in reload vs discard - at least document that we do the reload message-passing to background at the least
// b/c it's the only way to get persistent listeners to alrams. this isn't need in reloader, but still a bit weird we take
// 2 approaches.  TODO ALSO - get the fxns that do stuff out to modules, not directly in the background.js or in popup reloader js.

// TODO consider: is is useful to have an overview of what is currently reloading/discarded in the UI. at least tucked away somewhere? that would also
// suggest you should be able to modify that list there. not sure i want/need to get into that. so, i dunno - maybe just some debug R/O feature.

const DEFAULT_RELOAD_MINS = 0.5;

//TODO confirm IFFE needed
(() => {
  'use strict';

  let reloadCurrentBtn;
  let stopCurrentBtn;
  let reloadIntervalInput;

  const updateControlStates = async (reloadState) => {
    logToUi(reloadState);

    // is there anything we can do to show we're reloading a given tab? i suspect limited, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.

    reloadCurrentBtn.disabled = reloadState.alarmed;
    reloadIntervalInput.disabled = reloadState.alarmed;
    if(reloadState.alarmed) reloadIntervalInput.value = reloadState.intervalMins;

    stopCurrentBtn.disabled = !reloadState.alarmed;
  };

  const stopHandler = async (tab) => {
    //TODO confirm await is necessary/supported here and elsewhere. the api for this is weird.

    const reloadState = await chrome.runtime.sendMessage({
      action: 'stopReloadTab',
      tab
    });

    await updateControlStates(reloadState);
  };

  const startHandler = async (tab) => {
    const reloadState = await chrome.runtime.sendMessage({
      action: 'startReloadTab',
      tab,
      intervalMins: Number.parseFloat(reloadIntervalInput.value)
    });

    //this requires the tab id. and it wants to send to a content script, not service worker. fails.
    // const response = await chrome.tabs.sendMessage(currentTab.id, {action: 'startReload', tabId: currentTab.id});

    await updateControlStates(reloadState);
  };

  window.addEventListener('DOMContentLoaded', async (event) => {
    // console.dir(chrome.extension.getBackgroundPage());  //undefined
    //console.dir(chrome.runtime.getBackgroundPage());  //explodes - do not have a background page - a background script is not same thing. background 'page' appears to be a means to include a bunch of scripts together? unclear.

    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');
    reloadIntervalInput = document.querySelector('#reloadInterval');

    const currentTab = await getCurrentTab();
    logToUi(`current tab: ${currentTab.id}`);
    logToUi(`alarms: `, await chrome.alarms.getAll());

    reloadIntervalInput.defaultValue = DEFAULT_RELOAD_MINS.toString();

    reloadCurrentBtn.addEventListener('click', startHandler.bind(null,  currentTab));
    stopCurrentBtn.addEventListener('click', stopHandler.bind(null,  currentTab));

    const reloadState = await chrome.runtime.sendMessage({
      action: 'getTabReloadState',
      tab: currentTab
    });

    await updateControlStates(reloadState);
  });

  //TEMP/dev mode thing
  //NOTE you DO need to reload if you mess with background js.  with just popup changes you don't.
  const devTools =  document.querySelector('#dev-tools');

  if(DEV_MODE) {
    devTools.querySelector('#reset-ext-btn').addEventListener('click', async () => {
      chrome.alarms.clearAll();
      chrome.runtime.reload();
    });
  } else {
    devTools.hidden = true;
  }
})();
