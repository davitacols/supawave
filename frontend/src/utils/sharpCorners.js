// Utility to convert rounded corners to sharp corners
export const makeSharp = (content) => {
  return content
    .replace(/rounded-xl/g, '')
    .replace(/rounded-lg/g, '')
    .replace(/rounded-md/g, '')
    .replace(/rounded/g, '')
    .replace(/rounded-full/g, '')
    .replace(/rounded-2xl/g, '')
    .replace(/rounded-3xl/g, '');
};