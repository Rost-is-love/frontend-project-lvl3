import parse from './parsers.js';

export default (data, watchedState) => {
  const doc = parse(data);
  console.log(doc);
  const mainTitle = doc.querySelector('title');
  const mainDscr = doc.querySelector('description');
  const feeds = document.querySelector('.feeds');
  const posts = document.querySelector('.posts');

  if (!watchedState.feeds) {
  }
  console.log(mainTitle, mainDscr);
};
