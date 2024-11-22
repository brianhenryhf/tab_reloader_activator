import { getCurrentTab } from './utils.js';
import { logToUi } from './dev_utils.js';

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


const DEFAULT_RELOAD_MINS = 0.5;

//TODO confirm IFFE needed
(() => {
  'use strict';

  let reloadCurrentBtn;
  let stopCurrentBtn;
  let reloadIntervalInput;

  const updateControlStates = async (reloadState) => {
    logToUi((reloadState))
    // is there anything we can do to show we're reloading a given tab? i suspect limited, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.

    reloadCurrentBtn.disabled = reloadState.alarmed;
    reloadIntervalInput.disabled = reloadState.alarmed;
    if(reloadState.alarmed) reloadIntervalInput.value = reloadState.intervalMins;

    stopCurrentBtn.disabled = !reloadState.alarmed;
  };

  window.addEventListener('DOMContentLoaded', async (event) => {
    // console.dir(chrome.extension.getBackgroundPage());  //undefined
    //console.dir(chrome.runtime.getBackgroundPage());  //explodes - do not have a background page - a background script is not same thing. background 'page' appears to be a means to include a bunch of scripts together? unclear.

    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');
    reloadIntervalInput = document.querySelector('#reloadInterval');

    const currentTab = await getCurrentTab();
    logToUi(`current tab: ${currentTab.id}`);

    logToUi(`alarms follow: `);
    logToUi(await chrome.alarms.getAll());

    reloadIntervalInput.defaultValue = DEFAULT_RELOAD_MINS.toString();

    let reloadState;

    reloadCurrentBtn.addEventListener('click', async () => {
      reloadState = await chrome.runtime.sendMessage({
        action: 'startReloadTab',
        tab: currentTab,
        intervalMins: Number.parseFloat(reloadIntervalInput.value)
      });

      //this requires the tab id. and it wants to send to a content script, not service worker. fails.
      // const response = await chrome.tabs.sendMessage(currentTab.id, {action: 'startReload', tabId: currentTab.id});

      await updateControlStates(reloadState);
    });

    stopCurrentBtn.addEventListener('click', async () => {

      //TODO confirm await is necessary/supported here and elsewhere. the api for this is weird.

      reloadState = await chrome.runtime.sendMessage({
        action: 'stopReloadTab',
        tab: currentTab
      });

      await updateControlStates(reloadState);
    });

    reloadState = await chrome.runtime.sendMessage({
      action: 'getTabReloadState',
      tab: currentTab
    });

    await updateControlStates(reloadState);
  });



  //TEMP/dev mode thing
  //DO need to reload if you mess with background js.  with just popup changes you don't.
  document.querySelector('#reset-ext-btn').addEventListener('click', async () => {
    chrome.alarms.clearAll();
    chrome.runtime.reload();
  })

})();
