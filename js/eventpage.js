// this is borrowed from tab saver


(function() {
  'use strict';

  var config = null;

  var getWindowData = function(callback) {
    //note these are only for current profile...
    chrome.windows.getAll({populate:true}, function(windows) {
      var windowData = [];
      windows.forEach(function(window) {
        var tabData = [];
        var windowDatum = {id: window.id, tabs: tabData};
        
        window.tabs.forEach(function(tab) {        
          //output += tab.title + ": " + tab.url + "\n";
          tabData.push({title: tab.title, url: tab.url});
        });

        windowData.push(windowDatum);
      });  
      callback(windowData);
    });
  };

  //returns whatever fxn returns, for convenience 
  var withSnapshots = function(fxn) {
    var snapshots = JSON.parse(localStorage.snapshots || null);
    if(!snapshots) snapshots = [];
    var returnval = fxn(snapshots);
    localStorage.snapshots = JSON.stringify(snapshots);
    return returnval;
  };

  //records data in localstorage for this extension
  //note most recent first.
  var recordSnapshot = function(windowData) {
    withSnapshots(function (snapshots) {
      snapshots.unshift({
        date: new Date().toISOString(),
        windows: windowData
      });
    });
  };

  var pruneSnapshots = function() {
    withSnapshots(function (snapshots) {
      while(snapshots.length >= config.numSnapshots) {
        snapshots.pop();
      }
    });
  };


  var saveSessionInfo = function() {
    console.log("saving @ " + new Date());
    pruneSnapshots();
    getWindowData(function(windowData) {
      recordSnapshot(windowData); 
    });  
  };


  var getMostRecentSnapshot = function() {
    return withSnapshots(function (snapshots) {
      return snapshots.length > 0 ? snapshots[0] : null;
    });
  };

  //callback will be invoked with global config object set up
  var initConfig = function(cb) {
    //can't really see sync storage in devtools, which sucks
    chrome.storage.sync.get({
      numSnapshots: 5, //default
      saveIntervalMins: 45
    }, function(items) {
      //setting global config obj vals.
      config = {
        numSnapshots: items.numSnapshots,
        saveIntervalMins: items.saveIntervalMins
      };
      
      cb();
    });  
  };


  var notifyConfigUpdate = function() {
    console.log("updating config");
    initConfig(function() {
      //not worried about num snapshots.  that will work itself out eventually.
      chrome.alarms.create('tabSave', {periodInMinutes: config.saveIntervalMins});
    });
  };

  //make available to other scripts through getBackgroundPage
  var Snapshotter = window.Snapshotter = window.Snapshotter || {};
  Snapshotter.getMostRecentSnapshot = getMostRecentSnapshot;
  Snapshotter.saveSessionInfo = saveSessionInfo;
  Snapshotter.notifyConfigUpdate = notifyConfigUpdate;
  


  initConfig(function() {
    chrome.runtime.onInstalled.addListener(function() {
      //not 100% sure this is getting called on initial install...  seem to have empty snapshots array in localStorage?  
      //well, this did go fine when i installed on another profile.  not sure what the deal is.  some interaction with saving
      //  options from options page too soon? 
      saveSessionInfo();
      chrome.alarms.create('tabSave', {periodInMinutes: config.saveIntervalMins});
    });

    //have to have this at top level (on in onInstalled, which only runs once).  
    //  when event page loads again, the listener needs to be associated
    chrome.alarms.onAlarm.addListener(function(alarm) {
      console.log("alarm: " + alarm.name);
      if(alarm.name == 'tabSave') saveSessionInfo();
    });
  });



  chrome.browserAction.setBadgeText({text: "BG"});


  chrome.runtime.onSuspend.addListener(function() {
    console.log("Unloading.");
    chrome.browserAction.setBadgeText({text: ""});
  }); //end initconfig
}());