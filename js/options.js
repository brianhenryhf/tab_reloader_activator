function restoreOptions() {
  chrome.storage.sync.get({
    numSnapshots: 5, //default - probably should just be setting in event page on install..
    saveIntervalMins: 45
  }, function(items) {
    $('#numSnapshots').val(items.numSnapshots);
    $('#saveIntervalMins').val(items.saveIntervalMins);
  });
} 

function saveOptions() {
  var numSnapshots = $('#numSnapshots').val(),
      saveIntervalMins = $('#saveIntervalMins').val(),
      $status = $('#status');

  if('' === numSnapshots || '' ===  saveIntervalMins) {
    $status.text('Invalid options.  Not saved.');
  } else {
    chrome.storage.sync.set({
      numSnapshots: parseInt(numSnapshots),
      saveIntervalMins: parseInt(saveIntervalMins)
    }, function() {
      // Update status to let user know options were saved.
      $status.text('Options saved.');
      setTimeout(function() {
        $status.text('');
      }, 1000);
      
      chrome.runtime.getBackgroundPage(function(window) { 
        window.Snapshotter.notifyConfigUpdate();
      });
    });  
  }
} 


$(function() {
  restoreOptions();
  $('#save').click(saveOptions);
});