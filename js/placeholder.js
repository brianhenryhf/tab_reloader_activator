(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const query = new URLSearchParams(document.location.search);
    const url = query.get('orig_url');
    const title = query.get('orig_title');

    document.getElementById('title').innerText = title;
    
    const urlEl = document.getElementById('url');
    urlEl.innerText = url;
    urlEl.href = url;

    document.title += ` ${title}`;
  });
 
})();