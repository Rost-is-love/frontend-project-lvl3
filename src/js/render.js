/* eslint-disable no-param-reassign */

export const renderError = (input, error) => {
  const feedbackEl = document.querySelector('.feedback');
  feedbackEl.classList.add('text-danger');
  feedbackEl.textContent = error;
  input.classList.add('is-invalid');
};

export const renderSuccess = (input) => {
  const feedbackEl = document.querySelector('.feedback');
  feedbackEl.classList.add('text-success');
  feedbackEl.textContent = 'RSS успешно загружен';

  if (feedbackEl.classList.contains('text-danger')) {
    feedbackEl.classList.remove('text-danger');
    input.classList.remove('is-invalid');
  }

  input.value = '';
  input.focus();
};

const createNewPost = (item, postsList) => {
  const liEl = document.createElement('li');
  const linkEl = document.createElement('a');
  const btnEl = document.createElement('button');
  const title = item.querySelector('title');
  const itemLink = item.querySelector('link');

  liEl.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
  linkEl.classList.add('font-weight-bold');
  linkEl.setAttribute('data-id', '2');
  linkEl.setAttribute('target', '_blank');
  linkEl.setAttribute('rel', 'noopener noreferrer');
  linkEl.setAttribute('href', itemLink.innerHTML);
  linkEl.textContent = title.innerHTML;
  btnEl.classList.add('btn', 'btn-primary', 'btn-sm');
  btnEl.setAttribute('type', 'button');
  btnEl.setAttribute('data-id', '2');
  btnEl.setAttribute('data-toggle', 'modal');
  btnEl.setAttribute('data-target', '#modal');
  btnEl.textContent = 'Просмотр';

  liEl.append(linkEl);
  liEl.append(btnEl);
  postsList.prepend(liEl);
};

export const render = (doc, watchedState) => {
  const mainTitle = doc.querySelector('title');
  const mainDscr = doc.querySelector('description');
  const feeds = document.querySelector('.feeds');
  const posts = document.querySelector('.posts');
  const postsItems = doc.querySelectorAll('item');

  if (watchedState.feeds.empty) {
    const newFeedsTitle = document.createElement('h2');
    const newPostsTitle = document.createElement('h2');
    const newFeedsUl = document.createElement('ul');
    const newPosstUl = document.createElement('ul');
    newFeedsUl.classList.add('list-group', 'mb-5');
    newPosstUl.classList.add('list-group');
    newFeedsTitle.textContent = 'Фиды';
    newPostsTitle.textContent = 'Посты';
    feeds.append(newFeedsTitle);
    feeds.append(newFeedsUl);
    posts.append(newPostsTitle);
    posts.append(newPosstUl);
    watchedState.feeds.empty = false;
  }

  const feedItem = document.createElement('li');
  const feedItemTitle = document.createElement('h3');
  const feedItemDescr = document.createElement('p');
  const feedsList = feeds.querySelector('.list-group');
  const postsList = posts.querySelector('.list-group');
  feedItem.classList.add('list-group-item');
  feedItemTitle.textContent = mainTitle.innerHTML;
  feedItemDescr.textContent = mainDscr.innerHTML;
  feedItem.append(feedItemTitle);
  feedItem.append(feedItemDescr);
  feedsList.prepend(feedItem);

  postsItems.forEach((item) => {
    createNewPost(item, postsList);
  });

  watchedState.form.processState = 'finished';
};
