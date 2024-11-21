import { getCurrentTab } from './utils.js';
import {logToUi, tsLog} from './dev_utils.js';

//  based on a tab id that's only good for a session. and you can re-get tabs by it.

// TODO - some other indicator of reloading state (and maybe a way to see all running alarms. at least for dev/debug purposes). oh, can see in console.
  // but also see all tabs in current window maybe. so i can tell what tab id is what.
// useful snippets for console
// await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT})

// for (const { id,  url } of await chrome.tabs.query({windowId: chrome.windows.WINDOW_ID_CURRENT})) {
//   console.log(`Name: ${id}, url: ${url}`);
// }

// TODO - ok try sendin message to background page and let that set up llisteners...

// TODO options for reload interval, of course

// TODO refresh popup when tab is reloaded or nav'd to another location... button states stay same. does tabid stay the same? bug or feature?

// note - well, i guess duh, but reloading a tab doesn't stop it from reloading (alarm is still active, tab id is not changed)
// surprising tho - if i close and paste url i a new tab, this is still reloading..
// TODO RECONFIRM


//TEMP
const DEFAULT_RELOAD_MINS = 0.5;

//TODO confirm IFFE needed
(() => {
  'use strict';

  let reloadCurrentBtn;
  let stopCurrentBtn;
  let reloadIntervalInput;

  const updateButtonStates = async (isAlarmed) => {
    // is there anything we can do to show we're reloading a given tab? i suspect limited, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.
    reloadCurrentBtn.disabled = isAlarmed;
    reloadIntervalInput.disabled = isAlarmed;
    stopCurrentBtn.disabled = !isAlarmed;
  };

  window.addEventListener('DOMContentLoaded', async (event) => {
    // console.dir(chrome.extension.getBackgroundPage());  //undefined
    //console.dir(chrome.runtime.getBackgroundPage());  //explodes - do not have a background page - a background script is not same thing. background 'page' appears to be a means to include a bunch of scripts together? unclear.

    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');
    reloadIntervalInput = document.querySelector('#reloadInterval');

    const currentTab = await getCurrentTab();
    // console.dir(currentTab)
    logToUi(`current tab: ${currentTab.id}`);

    logToUi(`all alarms: ${
      JSON.stringify(
        await chrome.alarms.getAll(),
        null,
        2
      )
      .replaceAll(/ /g, "&nbsp;")
      .replaceAll(/\t/g, "&nbsp;&nbsp;")
      .replaceAll(/\n/g, "<br />")
    }`);

    reloadIntervalInput.defaultValue = DEFAULT_RELOAD_MINS.toString();

    reloadCurrentBtn.addEventListener('click', async () => {
      //read:
      // https://developer.chrome.com/docs/extensions/reference/api/events#filtered
      // https://developer.chrome.com/docs/extensions/develop/concepts/messaging
      //
      const { isAlarmed } = await chrome.runtime.sendMessage({
        action: 'startReloadTab',
        tab: currentTab,
        intervalMins: Number.parseFloat(reloadIntervalInput.value)
      });

      //this requires the tab id. and it wants to send to a content script, not service worker. fails.
      // const response = await chrome.tabs.sendMessage(currentTab.id, {action: 'startReload', tabId: currentTab.id});

      console.log(`popup got back isAlarmed from startReloadTab: ${isAlarmed}`);

      await updateButtonStates(isAlarmed);
    });

    stopCurrentBtn.addEventListener('click', async () => {

      //TODO confirm await is necessary/supported here and elsewhere. the api for this is weird.

      const { isAlarmed } = await chrome.runtime.sendMessage({
        action: 'stopReloadTab',
        tab: currentTab,
        intervalMins: Number.parseInt(reloadIntervalInput.value)
      });

      await updateButtonStates(isAlarmed);
    });

    //TEMP/dev mode thing
    //DO need to reload if you mess with background js.  with just popup changes you don't.
    document.querySelector('#reset-ext-btn').addEventListener('click', async () => {
      chrome.alarms.clearAll();
      chrome.runtime.reload();
    })

    const { isAlarmed } = await chrome.runtime.sendMessage({
      action: 'getTabReloadState',
      tab: currentTab
    });

    await updateButtonStates(isAlarmed);
  });
})();
