export function replaceImageHosts(markdown) {
  const currentHost = window.location.host; 
  
  return markdown.replace(
    /!\[image\]\(http:\/\/[^/]+\/api\/images\/image\?id=\d+\)/g,
    match => {
      const pathStart = match.indexOf('/api/');
      const path = match.slice(pathStart, -1); 
      return `![image](http://${currentHost}${path})`;
    }
  );
}