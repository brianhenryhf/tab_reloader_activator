// this file has to be in extension root for whatever reason.  TODO reconfirm



// import { getCurrentTab } from './js/utils.js';


// NOTE WIP. options for dedupe include message passing b/w popup and worker, so popup can ask
// tab status. or just common util js used in each. given the crappy way you have to register listeners here, not entirely
// clear having the bg js "drive" the model is a big benefit, for the clumsiness of message-passing. not like we're storing
// any sort of state in worker, either, since we're just using global alarms.  still, perhaps a little
//trampy to have all the parts using the common library for manipulating this stuff. lines are not as clear.

const tabAlarmName = (tabId) => `tabReload-${tabId}`;

const isAlarmForTab = (alarm, tabId) => alarm.name === tabAlarmName(tabId);

const tabAlarmState = async (tabId) => {
  const alarms = await chrome.alarms.getAll();
  const tabSpecificAlarm = alarms.find(alarm => isAlarmForTab(alarm, tabId));

  return {
    tabId: tabId,
    alarmed: tabSpecificAlarm != null,
    intervalMins: tabSpecificAlarm?.periodInMinutes
  }
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

  if((await tabAlarmState(tabId)).alarmed) {
    console.log(`tab ${tabId} had an alarm! clearing..`);
    chrome.alarms.clear(tabAlarmName(tabId))
  }
});


const startReloadTab = async (tab, intervalMins) => {
  // shortcircuit if dupe request on same tab somehow
  if((await tabAlarmState(tab.id)).alarmed) return;

  // oh, this takes a callback.  but this is just be firing once, immediately. not helpful.
  await chrome.alarms.create(tabAlarmName(tab.id), { periodInMinutes: intervalMins });
}

const stopReloadTab = async (tab) => {
  //const alarms = await chrome.alarms.getAll();

  // console.log(`all alarms: ${alarms.map(a => a.name)}`)
  // console.log(`this tab: ${tab.id}`)

  if((await tabAlarmState(tab.id)).alarmed) {
    console.log(`tab ${tab.id} has an alarm! clearing..`);
    chrome.alarms.clear(tabAlarmName(tab.id))
  }
};

const getTabReloadState = async (tab) => await tabAlarmState(tab.id);


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.dir(request);  //payload sent. woo.
  // console.dir(sender);  //this is details about the extension. TODO do we need to filter on the right extension?


  // bananas: an async handler results in undefine when the response reaches the caller. can't return anything that would
  // rely on async method. b/c promise can't be passed here. https://developer.chrome.com/docs/extensions/develop/concepts/messaging#external-webpage:~:text=Async%20functions%20are%20not%20supported%20because%20they%20return%20a%20Promise%2C%20which%20is%20not%20supported
  // This async iffe allows this all to resolve to a promise that's basically chucked, except the 'return true' for this
  // message allows the promise to resolve behind the scenes i guess. https://stackoverflow.com/a/46628145/1795230
  // TODO might be more grokkable with the manual promise handling in that solution.
  (async () => {
    let result;
    // console.dir(request.tab)
    switch (request.action) {
      case 'startReloadTab':
        await startReloadTab(request.tab, request.intervalMins);
        result = await getTabReloadState(request.tab);
        sendResponse(result);
        // NOTE you really have to sendReponse at least if you return true. else silence....
        break;
      case 'stopReloadTab':
        await stopReloadTab(request.tab);
        result = await getTabReloadState(request.tab);
        sendResponse(result);
        break;
      case 'getTabReloadState':
        result = await getTabReloadState(request.tab);
        sendResponse(result);
        break;
      default:
        console.log(`unknown action received by bg: ${request.action}`);
    }
  })();

  return true;
});