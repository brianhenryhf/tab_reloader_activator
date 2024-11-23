// convenience method - this can be useful in popup debugging, for example.
export const logToUi = (...msgs) => {
  // logs msgs with no newline b/w them
  const compositeMsg = msgs.map(msg => {
    if(msg instanceof Object) {
      return JSON.stringify(
          msg,
          null,
          2
      )
      .replaceAll(/ /g, "&nbsp;")
      .replaceAll(/\t/g, "&nbsp;&nbsp;")
      .replaceAll(/\n/g, "<br />");
    } else return msg;
  })
  const formattedContent = tsLogStr(compositeMsg.join(''));

  const node = document.createElement('li');;
  node.innerHTML = formattedContent;
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