// convenience method - this can be useful in popup debugging, for example.
export const logToUi = (msg, addTimestamp = true) => {
  if(msg instanceof Object) {
    msg = JSON.stringify(
        msg,
        null,
        2
    )
    .replaceAll(/ /g, "&nbsp;")
    .replaceAll(/\t/g, "&nbsp;&nbsp;")
    .replaceAll(/\n/g, "<br />");
  }

  const node = document.createElement('li');
  let content = msg != null ? msg : '';

  if(addTimestamp) content = tsLogStr(content);
  console.log(content)
  node.innerHTML = content;
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