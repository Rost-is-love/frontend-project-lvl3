/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';
import _ from 'lodash';

export default (state, elements) => {
  const {
    input,
    submitButton,
    feeds,
    posts,
    feedbackEl,
    modalTitle,
    modalBody,
    modalLink,
  } = elements;

  const feedRender = (value, previousValue) => {
    const newFeed = _.differenceWith(value, previousValue, _.isEqual)[0];

    if (!feeds.querySelector('.list-group')) {
      const newFeedsTitle = document.createElement('h2');
      const newFeedsUl = document.createElement('ul');
      newFeedsUl.classList.add('list-group', 'mb-5');
      newFeedsTitle.textContent = i18next.t('titles.feeds');
      feeds.append(newFeedsTitle);
      feeds.append(newFeedsUl);
    }

    const feedItem = document.createElement('li');
    const feedItemTitle = document.createElement('h3');
    const feedItemDescr = document.createElement('p');
    const feedsList = feeds.querySelector('.list-group');
    feedItem.classList.add('list-group-item');
    feedItemTitle.textContent = newFeed.title;
    feedItemDescr.textContent = newFeed.description;
    feedItem.append(feedItemTitle);
    feedItem.append(feedItemDescr);
    feedsList.prepend(feedItem);
  };

  const postsRender = (value, previousValue) => {
    const newPosts = _.differenceWith(value, previousValue, _.isEqual);

    if (!posts.querySelector('.list-group')) {
      const newPostsTitle = document.createElement('h2');
      const newPosstUl = document.createElement('ul');
      newPosstUl.classList.add('list-group');
      newPostsTitle.textContent = i18next.t('titles.posts');
      posts.append(newPostsTitle);
      posts.append(newPosstUl);
    }

    newPosts.forEach((post) => {
      const postsList = posts.querySelector('.list-group');
      const liEl = document.createElement('li');
      const linkEl = document.createElement('a');
      const btnEl = document.createElement('button');
      const id = value.indexOf(post);

      liEl.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
      );
      linkEl.classList.add('font-weight-bold');
      linkEl.setAttribute('data-id', `${id}`);
      linkEl.setAttribute('target', '_blank');
      linkEl.setAttribute('rel', 'noopener noreferrer');
      linkEl.setAttribute('href', post.link);
      linkEl.textContent = post.title;
      btnEl.classList.add('btn', 'btn-primary', 'btn-sm');
      btnEl.setAttribute('type', 'button');
      btnEl.setAttribute('data-id', `${id}`);
      btnEl.setAttribute('data-toggle', 'modal');
      btnEl.setAttribute('data-target', '#modal');
      btnEl.textContent = i18next.t('buttons.post');

      liEl.append(linkEl);
      liEl.append(btnEl);

      if (!posts.querySelector('.list-group')) {
        postsList.append(liEl);
      } else {
        postsList.prepend(liEl);
      }
    });
  };

  const openModal = (id, watchedState) => {
    const curPost = watchedState.posts[id];
    const titleEl = document.querySelector(`a[data-id="${id}"]`);

    modalTitle.textContent = curPost.title;
    modalBody.textContent = curPost.description;
    modalLink.setAttribute('href', curPost.link);

    if (watchedState.uiState.readedPosts.indexOf(id) === -1) {
      titleEl.classList.remove('font-weight-bold');
      titleEl.classList.add('font-weight-normal');
      watchedState.uiState.readedPosts.push(id);
    }
  };

  const renderError = (error) => {
    feedbackEl.classList.add('text-danger');
    feedbackEl.textContent = i18next.t(`errorMessages.${error}`);
    input.classList.add('is-invalid');
  };

  const renderSuccess = (message) => {
    feedbackEl.classList.add('text-success');
    feedbackEl.textContent = message;

    if (feedbackEl.classList.contains('text-danger')) {
      feedbackEl.classList.remove('text-danger');
      input.classList.remove('is-invalid');
    }

    input.value = '';
    input.focus();
  };

  const processStateHandler = (processState) => {
    switch (processState) {
      case 'failed':
        submitButton.disabled = false;
        input.readOnly = false;
        break;
      case 'filling':
        submitButton.disabled = false;
        input.readOnly = false;
        break;
      case 'sending':
        submitButton.disabled = true;
        input.readOnly = true;
        break;
      case 'finished':
        submitButton.disabled = false;
        input.readOnly = false;
        renderSuccess(i18next.t('successMessages.feeds'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value, previousValue) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value, watchedState);
        break;
      case 'form.error':
        renderError(value);
        break;
      case 'feeds':
        feedRender(value, previousValue);
        break;
      case 'posts':
        postsRender(value, previousValue);
        break;
      case 'uiState.modalPostId':
        openModal(value, watchedState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
