import { getCurrentTab } from './utils.js';
import { logToUi } from './dev_utils.js';


// TODO basically functional - check in
// TODO - buttons that know if tab is reloading.
// TODO - some other indicator of reloading state
// TOOD options for reload interval


// TOOD no-discard fucntionality - priritize this!! the above is important, but don't care prioritywise




const RELOAD_MINS_TEMP = 0.5;

//confirm IFFE needed
(() => {
  'use strict';

  // yeah, regex stuff is fiddly, filter it out.
  const tabAlarmName = (tab) => `tabReload-${tab.id}`;

  const isAlarmForTab = (alarm, tab) => alarm.name === tabAlarmName(tab);

  const startReloadTab = async (tab) => {
    // shortcircuit if dupe request on same tab
    if((await chrome.alarms.getAll()).some(alarm => isAlarmForTab(alarm, tab))) return;

    // oh, this takes a callback.  but this is just be firing once, immediately. not helpful.
    await chrome.alarms.create(tabAlarmName(tab), { periodInMinutes: RELOAD_MINS_TEMP });

    chrome.alarms.onAlarm.addListener((alarm) => {
      // logToUi(`FIRED event ${alarm.name} for tab ${tabId}`);
      // interestingly, the id type matters for sig match. Um, aren't we doing javascript here?
      if(isAlarmForTab(alarm, tab)) {
          console.log('reloading!')
        chrome.tabs.reload(tab.id);
      } else console.log('nope')

    });

    // is there anything we can do to show we're reloading a given tab? i suspect not, but look into. i guess can highlight the extension button. but prolly can't mess witht he tab.
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


  // TODO bring this back in.  indicator of reloadingness is needed.

  // const toggleSuspend = async (tab) => {
  //   if(isSuspendedPageUrl(tab.url)) {
  //     return unsuspendTab(tab);
  //   } else {
  //     if(isSuspendableUrl(tab.url)) {
  //       return suspendTab(tab);
  //     }
  //   }
  // };


  // const updateButtonStates = (currentTab, windowTabs) => {
  //   log('here')
  //   // a page that is in process of loading the placeholder page may have "status":"loading" and a value for pendingUrl reflecting the new url.
  //   // MAY be true for a page just starting to load as well - haven't confirmed, but would make sense
  //   suspendCurrentBtn.disabled = !isSuspendableUrl(currentTab.pendingUrl || currentTab.url);
  //   unsuspendCurrentBtn.disabled = !isSuspendedPageUrl(currentTab.pendingUrl || currentTab.url);
  //
  //   //rare case, but if _all_ tabs are not suspendable, then the button is disabled.  if any of them is, suspend button is usable.  'all' term should probably be 'any'.
  //   suspendAllBtn.disabled = windowTabs.every(it => !isSuspendableUrl(it.pendingUrl || it.url));
  //   unsuspendAllBtn.disabled = !windowTabs.some(it => isSuspendedPageUrl(it.pendingUrl || it.url));
  // };


  let reloadCurrentBtn;
  let stopCurrentBtn;

  window.addEventListener('DOMContentLoaded', async (event) => {
    // log('popup loaded');
    reloadCurrentBtn = document.querySelector('#reload-btn');
    stopCurrentBtn = document.querySelector('#stop-btn');

    const currentTab = await getCurrentTab();
    // log(tab)

    reloadCurrentBtn.querySelector('#reloadInterval').textContent = RELOAD_MINS_TEMP;

    reloadCurrentBtn.addEventListener('click', async () => {
      startReloadTab(currentTab);
    });

    stopCurrentBtn.addEventListener('click', async () => {
      stopReloadTab(currentTab);
    });



    //yeah prolly need to keep track of what is reloading and update buttons. capture where? in the hash? in storage? (but what happens if they leave and come back to the tab and don't expect it to be reloading still?_
    // state in the hash seems easier in that way. but we'r enot gonna poll every tab everywher to see if we're to reload. i mean if there's some ephemeral way to associate a timer to a tab... an id?
    //  yeah there's an id that's only good for a session. and you can re-get tabs by it. that's the cheese.

    // updateButtonStates(currentTab, windowTabs);
  });
})();
