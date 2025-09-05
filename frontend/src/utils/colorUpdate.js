// Global color update utility
export const updateColors = (content) => {
  return content
    .replace(/bg-red-(\d+)/g, 'bg-sky-$1')
    .replace(/text-red-(\d+)/g, 'text-sky-$1')
    .replace(/border-red-(\d+)/g, 'border-sky-$1')
    .replace(/ring-red-(\d+)/g, 'ring-sky-$1')
    .replace(/from-red-(\d+)/g, 'from-sky-$1')
    .replace(/to-red-(\d+)/g, 'to-sky-$1')
    .replace(/hover:bg-red-(\d+)/g, 'hover:bg-sky-$1')
    .replace(/hover:text-red-(\d+)/g, 'hover:text-sky-$1')
    .replace(/focus:ring-red-(\d+)/g, 'focus:ring-sky-$1')
    .replace(/focus:border-red-(\d+)/g, 'focus:border-sky-$1');
};