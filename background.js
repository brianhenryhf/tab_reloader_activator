// this file has to be in extension root for whatever reason.  TODO reconfirm



// import { getCurrentTab } from './js/utils.js';
//
//
// chrome.commands.onCommand.addListener(async (command) => {
//   console.log(`Command "${command}" triggered`);
//
//
//   // ok, module stuff works!
//
//
//   const t = await getCurrentTab()
//
//   console.log(t);
//
//   //this works - list for toggle-suspend command.  then port over basically all the popup code?  dang. ok, current tab is avail here.  so, not too too bad.  could try to import module?
// });


// NOTE the 3 dups here - bad. but WIP. options for dedupe include message passing b/w popup and worker, so popup can ask
// tab status. or just common util js used in each. given the crappy way you have to register listeners here, not entirely
// clear having the bg js "drive" the model is a big benefit, for the clumsiness of message-passing. not like we're storing
// any sort of state in worker, either, since we're just using global alarms.  still, perhaps a little
//trampy to have all the parts using the common library for manipulating this stuff. lines are not as clear.

const tabAlarmName = (tabId) => `tabReload-${tabId}`;

const isAlarmForTab = (alarm, tabId) => alarm.name === tabAlarmName(tabId);

/** does a tab have any alarm we care about (w/r/t reloading)? */
// Async! change naming to clarify? b/c always truthy when not awaited... blasted red/blue problem made worse with weak typing.
const isTabAlarmed = async (tabId) => {
  const alarms = await chrome.alarms.getAll();
  return alarms.some(alarm => isAlarmForTab(alarm, tabId));
};


// finicky to get  alarm listening to work - appears the listener has to be added as we do here - in worker, at root
// scope, seemingly without conditions, for it to remain functional/registered in the longer term. Else, the alarms keep
//firing, but nothing picks up on them.
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log(`a bg listener received event ${alarm.name}`);

  // this is crap, but meh
  const matchResult = alarm.name.match(/^tabReload-(.+)/);
  if(matchResult) {
    // interestingly, the numeric type is important. weird, for js, but there we are.
    const tabId = Number.parseInt(matchResult[1]);

    try {
      const tab = await chrome.tabs.get(tabId);
      console.log(`reloading tab ${tabId} (${tab.url})! b/c alarm ${alarm.name}`);
      chrome.tabs.reload(tabId);
    } catch (e){
      console.log(`tab ${tabId} cannot be retrieved for alarm ${alarm.name}. Killing alarm.`);
      chrome.alarms.clear(alarm.name);
    }
  }
});

// when tab closed, kill alarm. similar to alarm listener, this appears to need to be top level, no closures usable, etc.
// else, it will just vanish and no longer fire for event.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  console.log(`tab ${tabId} closed.`);

  if(await isTabAlarmed(tabId)) {
    console.log(`tab ${tabId} had an alarm! clearing..`);
    chrome.alarms.clear(tabAlarmName(tabId))
  }
});


const startReloadTab = async (tab, intervalMins) => {
  // shortcircuit if dupe request on same tab somehow
  if(await isTabAlarmed(tab.id)) return;

  // oh, this takes a callback.  but this is just be firing once, immediately. not helpful.
  await chrome.alarms.create(tabAlarmName(tab.id), { periodInMinutes: intervalMins });
}

const stopReloadTab = async (tab) => {
  const alarms = await chrome.alarms.getAll();

  // console.log(`all alarms: ${alarms.map(a => a.name)}`)
  // console.log(`this tab: ${tab.id}`)

  if(await isTabAlarmed(tab.id)) {
    console.log(`tab ${tabId} has an alarm! clearing..`);
    chrome.alarms.clear(tabAlarmName(tabId))
  }
};


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // console.dir(request);  //payload sent. woo.
  // console.dir(sender);  //this is details about the extension. TODO do we need to filter on the right extension?

  // console.dir(request.tab)
  switch (request.action) {
    case 'startReloadTab':
      await startReloadTab(request.tab, request.intervalMins);
      break;
    case 'stopReloadTab':
      await stopReloadTab(request.tab);
      break;
    default:
      console.log(`unknown action received by bg: ${request.action}`);
  }

  //   sendResponse({farewell: "goodbye"});
});