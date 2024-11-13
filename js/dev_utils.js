// convenience method - this can be useful in popup debugging, for example.
export const logToUi = (msg, addTimestamp = true) => {
  if(msg instanceof Object) msg = JSON.stringify(msg);

  const node = document.createElement('li');
  let content = msg ? msg : '';

  if(addTimestamp) content = `${new Date().toISOString()} - ` + content;
  node.append(content);
  document.querySelector('#log-area > ul').append(node);
};
