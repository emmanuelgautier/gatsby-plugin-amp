export const interpolate = (str, map) =>
  str.replace(/{{\s*[\w\.]+\s*}}/g, match => map[match.replace(/[{}]/g, "")]);
