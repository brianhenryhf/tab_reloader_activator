// convenience method - this can be useful in popup debugging, for example.
export const logToUi = (msg, addTimestamp = true) => {
  if(msg instanceof Object) msg = JSON.stringify(msg);

  const node = document.createElement('li');
  let content = msg ? msg : '';

  if(addTimestamp) content = tsLogStr(content);
  node.append(content);
  document.querySelector('#log-area > ul').append(node);
};

export const tsLogStr = (msg, localized = false) => {
  const dtString = localized ? new Date().toLocaleString() : new Date().toISOString();
  return `${dtString} - ${msg}`
}

// could see if object and dir or json, i suppose. for now, this is better than nothing.
export const tsLog = (msg) => {
  console.log(tsLogStr(msg));
}