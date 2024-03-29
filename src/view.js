/* eslint-disable no-param-reassign */
import onChange from 'on-change';

export default (state, elements, i18n) => {
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

  const renderFeeds = (watchedState) => {
    feedsEl.innerHTML = '';
    const { feeds } = watchedState;

    const newFeedsTitle = document.createElement('h2');
    const newFeedsUl = document.createElement('ul');
    newFeedsUl.classList.add('list-group', 'mb-5');
    newFeedsTitle.textContent = i18n.t('titles.feeds');

    feeds.forEach((feed) => {
      const feedItem = document.createElement('li');
      const feedItemTitle = document.createElement('h3');
      const feedItemDescr = document.createElement('p');
      feedItem.classList.add('list-group-item');
      feedItemTitle.textContent = feed.title;
      feedItemDescr.textContent = feed.description;
      feedItem.append(feedItemTitle);
      feedItem.append(feedItemDescr);
      newFeedsUl.append(feedItem);
    });

    feedsEl.append(newFeedsTitle);
    feedsEl.append(newFeedsUl);
  };

  const renderPosts = (watchedState) => {
    const { posts } = watchedState;
    const { readedPosts } = watchedState.uiState;
    const newPostsTitle = document.createElement('h2');
    const newPosstUl = document.createElement('ul');
    newPosstUl.classList.add('list-group');
    newPostsTitle.textContent = i18n.t('titles.posts');

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
      const fontWeight = readedPosts.has(post.id)
        ? 'font-weight-normal'
        : 'font-weight-bold';
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
      btnEl.textContent = i18n.t('buttons.post');

      liEl.append(linkEl);
      liEl.append(btnEl);
      newPosstUl.append(liEl);
    });

    postsEl.innerHTML = '';
    postsEl.append(newPostsTitle);
    postsEl.append(newPosstUl);
  };

  const openModal = (watchedState) => {
    const id = watchedState.uiState.modalPostId;
    const curPost = watchedState.posts.find((post) => post.id === id);

    modalTitle.textContent = curPost.title;
    modalBody.textContent = curPost.description;
    modalLink.setAttribute('href', curPost.link);
  };

  const handleProcessState = (watchedState) => {
    switch (watchedState.form.processState) {
      case 'failed':
        submitButton.disabled = false;
        input.readOnly = false;
        feedbackEl.classList.add('text-danger');
        feedbackEl.textContent = i18n.t(`errorMessages.${watchedState.form.error}`);
        input.classList.add('is-invalid');
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
        feedbackEl.classList.add('text-success');
        feedbackEl.textContent = i18n.t('successMessages.feeds');

        if (feedbackEl.classList.contains('text-danger')) {
          feedbackEl.classList.remove('text-danger');
          input.classList.remove('is-invalid');
        }

        input.value = '';
        input.focus();
        break;
      default:
        throw new Error(`Unknown state: ${watchedState.form.processState}`);
    }
  };

  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'form.processState':
        handleProcessState(watchedState);
        break;
      case 'feeds':
        renderFeeds(watchedState);
        break;
      case 'posts':
        renderPosts(watchedState);
        break;
      case 'uiState.modalPostId':
        openModal(watchedState);
        break;
      case 'uiState.readedPosts':
        renderPosts(watchedState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
