export function replaceImageHosts(markdown) {
  const currentHost = window.location.hostname + ':3000';

  return markdown.replace(
    /!\[image\]\(http:\/\/[^/]+:3000\/api\/images\/image\?id=\d+\)/g,
    match => {
      const pathStart = match.indexOf('/api/');
      const path = match.slice(pathStart, -1); // remove the trailing ')'
      return `![image](http://${currentHost}${path})`;
    }
  );
}
