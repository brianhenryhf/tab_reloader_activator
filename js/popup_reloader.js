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

// TODO - some other indicator of reloading state
// TODO options for reload interval, of course

// TODO refresh popup when tab is reloaded or nav'd to another location... button states stay same. does tabid stay the same? bug or feature?

// note - well, i guess duh, but reloading a tab doesn't stop it from reloading (alarm is still active, tab id is not changed)
// surprising tho - if i close and paste url i a new tab, this is still reloading..
// TODO RECONFIRM


const RELOAD_MINS_TEMP = 0.5;

//confirm IFFE needed
(() => {
  'use strict';

  // for now, we assume only reload alarms are important to us. later, we might adjust naming or make more geenric and bind to something specific or whatever.

  // yeah, regex stuff is fiddly, filter it out.
  const tabAlarmName = (tab) => `tabReload-${tab.id}`;

  /** is a particular alarm relevant to a given tab */
  const isAlarmForTab = (alarm, tab) => alarm.name === tabAlarmName(tab);

  /** does a tab have any alarm we care about (w/r/t reloading)? */
  // Async! change naming to clarify? b/c always truthy... blasted red/blue problem made worse with weak typing.
  const isTabAlarmed = async (tab) => {
    const alarms = await chrome.alarms.getAll();
    return alarms.some(alarm => isAlarmForTab(alarm, tab));
  };

  const startReloadTab = async (tab) => {
    // shortcircuit if dupe request on same tab
    if(await isTabAlarmed(tab)) return;

    // oh, this takes a callback.  but this is just be firing once, immediately. not helpful.
    await chrome.alarms.create(tabAlarmName(tab), { periodInMinutes: RELOAD_MINS_TEMP });

    chrome.alarms.onAlarm.addListener((alarm) => {
      // logToUi(`FIRED event ${alarm.name} for tab ${tabId}`);
      // interestingly, the id type matters for sig match. Um, aren't we doing javascript here?
      if(isAlarmForTab(alarm, tab)) {
        console.log(`reloading! b/c ${alarm.name}`)
        chrome.tabs.reload(tab.id);
      } else console.log(`nope, not ${alarm.name}`);
    });

    // when tab closed, kill alarm
    chrome.tabs.onRemoved.addListener((tabId) => {
      if(tab.id === tabId) chrome.alarms.clear(tabAlarmName(tab));
    });

    // is there anything we can do to show we're reloading a given tab? i suspect limited, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.
  };


  const stopReloadTab = async (tab) => {
    const alarms = await chrome.alarms.getAll();

    // console.log(`all alarms: ${alarms.map(a => a.name)}`)
    // console.log(`this tab: ${tab.id}`)

    //this shoild just be first or some or whatever
    alarms.some(alarm => {
      if(isAlarmForTab(alarm, tab)) {
        chrome.alarms.clear(tabAlarmName(tab));
        return true;
      }
    });
  };


  let reloadCurrentBtn;
  let stopCurrentBtn;

  const updateButtonStates = async (currentTab) => {
    reloadCurrentBtn.disabled = await isTabAlarmed(currentTab);
    stopCurrentBtn.disabled = !reloadCurrentBtn.disabled;
  };


  window.addEventListener('DOMContentLoaded', async (event) => {
    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');

    const currentTab = await getCurrentTab();
    // console.dir(currentTab)

    reloadCurrentBtn.querySelector('#reloadInterval').textContent = RELOAD_MINS_TEMP;

    reloadCurrentBtn.addEventListener('click', async () => {
      await startReloadTab(currentTab);
      await updateButtonStates(currentTab);
    });

    stopCurrentBtn.addEventListener('click', async () => {
      await stopReloadTab(currentTab);
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
