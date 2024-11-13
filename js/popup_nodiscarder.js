import { getCurrentTab } from './utils.js';
import { logToUi } from './dev_utils.js';

(() => {
  'use strict';

  // TODO test function
  // TODO cogitate on effects of navigating away, closing/reopening, etc. Curious to know effect on restart, but just to document, at best.


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
    // console.dir(currentTab)

    stopDiscardBtn.addEventListener('click', async () => {
      const updatedTab = await stopDiscardTab(currentTab);
      await updateButtonStates(updatedTab);
    });

    restartDiscardBtn.addEventListener('click', async () => {
      const updatedTab = await restartDiscardTab(currentTab);
      await updateButtonStates(updatedTab);
    });

    await updateButtonStates(currentTab);
  });
})();
