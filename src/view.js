/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';

export default (state, elements) => {
  const {
    input,
    submitButton,
    feedsEl,
    postsEl,
    feedbackEl,
    modalTitle,
    modalBody,
    modalLink,
  } = elements;

  const feedRender = (watchedState) => {
    feedsEl.innerHTML = '';
    const { feeds } = watchedState;

    const newFeedsTitle = document.createElement('h2');
    const newFeedsUl = document.createElement('ul');
    newFeedsUl.classList.add('list-group', 'mb-5');
    newFeedsTitle.textContent = i18next.t('titles.feeds');

    feeds.forEach((feed) => {
      const feedItem = document.createElement('li');
      const feedItemTitle = document.createElement('h3');
      const feedItemDescr = document.createElement('p');
      feedItem.classList.add('list-group-item');
      feedItemTitle.textContent = feed.title;
      feedItemDescr.textContent = feed.description;
      feedItem.append(feedItemTitle);
      feedItem.append(feedItemDescr);
      newFeedsUl.prepend(feedItem);
    });

    feedsEl.append(newFeedsTitle);
    feedsEl.append(newFeedsUl);
  };

  const postsRender = (watchedState) => {
    postsEl.innerHTML = '';
    const { posts } = watchedState;
    const { readedPosts } = watchedState.uiState;
    const newPostsTitle = document.createElement('h2');
    const newPosstUl = document.createElement('ul');
    newPosstUl.classList.add('list-group');
    newPostsTitle.textContent = i18next.t('titles.posts');

    posts.forEach((post) => {
      const liEl = document.createElement('li');
      const linkEl = document.createElement('a');
      const btnEl = document.createElement('button');

      liEl.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
      );
      // prettier-ignore
      const fontWeight = readedPosts.indexOf(post.id) === -1
        ? 'font-weight-bold'
        : 'font-weight-normal';
      linkEl.classList.add(fontWeight);
      linkEl.setAttribute('data-id', `${post.id}`);
      linkEl.setAttribute('target', '_blank');
      linkEl.setAttribute('rel', 'noopener noreferrer');
      linkEl.setAttribute('href', post.link);
      linkEl.textContent = post.title;
      btnEl.classList.add('btn', 'btn-primary', 'btn-sm');
      btnEl.setAttribute('type', 'button');
      btnEl.setAttribute('data-id', `${post.id}`);
      btnEl.setAttribute('data-toggle', 'modal');
      btnEl.setAttribute('data-target', '#modal');
      btnEl.textContent = i18next.t('buttons.post');

      liEl.append(linkEl);
      liEl.append(btnEl);
      newPosstUl.append(liEl);
    });

    postsEl.append(newPostsTitle);
    postsEl.append(newPosstUl);
  };

  const openModal = (watchedState) => {
    const id = watchedState.uiState.modalPostId;
    const curPost = watchedState.posts.filter((post) => post.id === id)[0];
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

  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(watchedState.form.processState);
        break;
      case 'form.error':
        renderError(watchedState.form.error);
        break;
      case 'feeds':
        feedRender(watchedState);
        break;
      case 'posts':
        postsRender(watchedState);
        break;
      case 'uiState.modalPostId':
        openModal(watchedState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
