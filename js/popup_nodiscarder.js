import { getCurrentTab } from './utils.js';
import { logToUi, DEV_MODE } from './dev_utils.js';

(() => {
  'use strict';

  // TODO test function - confirmed!
  // TODO cogitate on effects of navigating away, closing/reopening, etc. Curious to know effect on restart, but just to document, at best.
  // hm - you can make extension reload itself. interesting.  https://developer.chrome.com/docs/extensions/reference/api/runtime#method-reload
  // but in dev mode, seems like it actually does this already. so, good.
  //  i guess check and be sure it doesn't get latest vsn in dev mode anyway. oh, could just make it a button in the extension or somehting... easier than finding the xtensinos tab and mesing with that. that's annoying.
  //  build tool could help me keep track of versions, perhaps? so i know what i  have running in what profile...


  // TODO note that my dev reload thing doesn't undo no-discard. i don't think.  but it does kill the badge. not ideal.
  // also could dump reload state in devmode to popup...

  // TODO also consider updating extension title for this or reload activation

  const isTabDiscardable = (tab) => {
    return tab.autoDiscardable;
  };

  const stopDiscardTab = async (_tab) => {
    //ok, this does update this field. but it's not reflected in tab reference passed in.
    return await chrome.tabs.update({ autoDiscardable: false });
  };

  const restartDiscardTab = async (_tab) => {
    return await chrome.tabs.update({ autoDiscardable: true });
  };

  const updateBadge = async (tabId, discardStopped) => {
    const baseSpec = { tabId };

    if(discardStopped) {
      await chrome.action.setBadgeText({ ...baseSpec, text: "☕️" });
      await chrome.action.setBadgeBackgroundColor({ ...baseSpec, color: "white" });
    } else {
      await chrome.action.setBadgeText({ ...baseSpec, text: null });
    }
  }


  let stopDiscardBtn;
  let restartDiscardBtn;

  const updateButtonStates = async (currentTab) => {
    stopDiscardBtn.disabled = !isTabDiscardable(currentTab); //confirm this syntax...
    restartDiscardBtn.disabled = !stopDiscardBtn.disabled;
  };


  window.addEventListener('DOMContentLoaded', async (event) => {
    stopDiscardBtn = document.querySelector('#nodiscard-btn');
    restartDiscardBtn = document.querySelector('#rediscard-btn');

    const currentTab = await getCurrentTab();

    stopDiscardBtn.addEventListener('click', async () => {
      const updatedTab = await stopDiscardTab(currentTab);
      logToUi(`discarding stopped?: ${!isTabDiscardable(updatedTab)}`);
      await updateBadge(updatedTab.id, !isTabDiscardable(updatedTab));
      await updateButtonStates(updatedTab);
    });

    restartDiscardBtn.addEventListener('click', async () => {
      const updatedTab = await restartDiscardTab(currentTab);
      logToUi(`discarding stopped?: ${!isTabDiscardable(updatedTab)}`);
      await updateBadge(updatedTab.id, !isTabDiscardable(updatedTab));
      await updateButtonStates(updatedTab);
    });

    logToUi(`current tab (${currentTab.id}) discarding stopped?: ${!isTabDiscardable(currentTab)}`);
    // interesting - this flashes icon, but immediately vanishes. popup killing badge? oh, or maybe reload script (via background script) is... yeah, they are fighting for singular state..
    // perhaps all the more reason to have common hadnler in backgroun for this. but i think this may be a little complicated either way...
    // need to either keep some state on which thing is controller badge, or have each know previous possible text/color. or some other referee compoenent with those checks.

    // referee thing might check in the case of no current badge.. or if popup is being opened.. i guess the case of checking and updating NOT in direct reponse to a reload/nodiscard button click
    // is a little different - this needs to be smart and derive which thing might be going on currently. in normal usage, not sure if this will really come up,
    // as button clicks should just persist the right badge. but dunno. might be worth figuring out. some common ref fxn that knows how to ask reload AND nodiscard fxnality if they are
    // in operation. if yes, display right thing. if both are (shouldn't happen), have a built-in rule on which wins.

    // imean, i guess background script needs to be sole handler of updateBadge. and ask both apis which are in action.
    // it would be so nice if there was state about badge each could query and decide for themselves a little bit. in the meantime


    //ok for now, going to assume normal use doesn't have the conflict. we don't need to re-set the badge on pop-up open...
    // await updateBadge(currentTab.id, !isTabDiscardable(currentTab));

    await updateButtonStates(currentTab);
  });
})();
