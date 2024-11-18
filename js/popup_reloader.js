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

// TODO - ok try sendin message to background page and let that set up llisteners...

// TODO options for reload interval, of course

// TODO refresh popup when tab is reloaded or nav'd to another location... button states stay same. does tabid stay the same? bug or feature?

// note - well, i guess duh, but reloading a tab doesn't stop it from reloading (alarm is still active, tab id is not changed)
// surprising tho - if i close and paste url i a new tab, this is still reloading..
// TODO RECONFIRM


//TEMP
const RELOAD_MINS_TEMP = 0.5;

//TODO confirm IFFE needed
(() => {
  'use strict';

  // for now, we assume only reload alarms are important to us. later, we might adjust naming or make more geenric and bind to something specific or whatever.

  const tabAlarmName = (tab) => `tabReload-${tab.id}`;

  /** is a particular alarm relevant to a given tab */
  const isAlarmForTab = (alarm, tab) => alarm.name === tabAlarmName(tab);

  /** does a tab have any alarm we care about (w/r/t reloading)? */
  // Async! change naming to clarify? b/c always truthy... blasted red/blue problem made worse with weak typing.
  const isTabAlarmed = async (tab) => {
    const alarms = await chrome.alarms.getAll();
    return alarms.some(alarm => isAlarmForTab(alarm, tab));
  };


  let reloadCurrentBtn;
  let stopCurrentBtn;

  const updateButtonStates = async (currentTab) => {
    // is there anything we can do to show we're reloading a given tab? i suspect limited, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.
    reloadCurrentBtn.disabled = await isTabAlarmed(currentTab);
    stopCurrentBtn.disabled = !reloadCurrentBtn.disabled;
  };


  window.addEventListener('DOMContentLoaded', async (event) => {

    // console.dir(chrome.extension.getBackgroundPage());  //undefined
    //console.dir(chrome.runtime.getBackgroundPage());  //explodes - do not have a background page - a background script is not same thing. background 'page' appears to be a means to include a bunch of scripts together? unclear.

    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');

    const currentTab = await getCurrentTab();
    // console.dir(currentTab)
    logToUi(`current tab: ${currentTab.id}`);

    reloadCurrentBtn.querySelector('#reloadInterval').textContent = RELOAD_MINS_TEMP;

    reloadCurrentBtn.addEventListener('click', async () => {

      //read:
      // https://developer.chrome.com/docs/extensions/reference/api/events#filtered
      // https://developer.chrome.com/docs/extensions/develop/concepts/messaging
      //
      const response = await chrome.runtime.sendMessage({ action: 'startReloadTab', tab: currentTab, intervalMins: RELOAD_MINS_TEMP });

      //this requires the tab id. and it wants to send to a content script, not service worker. fails.
      // const response = await chrome.tabs.sendMessage(currentTab.id, {action: 'startReload', tabId: currentTab.id});

      console.log(response);

      await updateButtonStates(currentTab);
    });

    stopCurrentBtn.addEventListener('click', async () => {
      const response = await chrome.runtime.sendMessage({ action: 'stopReloadTab', tab: currentTab, intervalMins: RELOAD_MINS_TEMP });
      console.log(response);
      await updateButtonStates(currentTab);
    });

    //TEMP/dev mode thing
    //DO need to reload if you mess with background js.  with just popup changes you don't.
    document.querySelector('#reset-ext-btn').addEventListener('click', async () => {
      chrome.alarms.clearAll();
      chrome.runtime.reload();
    })

    await updateButtonStates(currentTab);
  });
})();
