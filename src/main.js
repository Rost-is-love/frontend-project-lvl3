/* eslint-disable no-param-reassign */
// import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales/ru.js';
import buildWatchedState from './view.js';
// prettier-ignore
import {
  render,
  createNewPost,
} from './render.js';
import createModal from './modal.js';

const schema = yup.string().url().required();

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('notValidRss');
  }
  return doc;
};

const validate = (watchedState, value) => {
  if (watchedState.feeds.indexOf(value) !== -1) {
    watchedState.form.processState = 'failed';
    watchedState.form.error = 'feeds';
    watchedState.form.valid = false;
  } else {
    try {
      schema.validateSync(value, { abortEarly: false });
      watchedState.form.valid = true;
    } catch {
      watchedState.form.error = 'url';
      watchedState.form.valid = false;
    }
  }
};

const buildUrl = (rssUrl) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com';
  const proxyApi = '/get';
  const url = new URL(`${proxy}${proxyApi}`);
  const params = url.searchParams;
  params.set('disableCache', true);
  params.set('url', rssUrl);

  return url.toString();
};

const checkUpdates = (watchedState) => {
  watchedState.feeds.forEach((link) => {
    axios
      .get(buildUrl(link))
      .then((response) => {
        const doc = parse(response.data.contents);
        return doc;
      })
      .then((doc) => {
        const posts = doc.querySelectorAll('item');
        const postsCont = document.querySelector('.posts');
        const postsList = postsCont.querySelector('.list-group');
        posts.forEach((post) => {
          const postLink = post.querySelector('link').innerHTML;
          if (watchedState.posts.links.indexOf(postLink) === -1) {
            createNewPost(post, postsList, watchedState);
          }
        });
      })
      .then(() => createModal(watchedState))
      .then(() => setTimeout(() => checkUpdates(watchedState), 5000));
  });
};

const loadFeed = (watchedState, value) => {
  axios
    .get(buildUrl(value))
    .then((response) => {
      const doc = parse(response.data.contents);
      return doc;
    })
    .then((doc) => {
      render(doc, watchedState);
    })
    .then(() => {
      createModal(watchedState);
      watchedState.feeds.push(value);
      if (watchedState.feeds.length === 1) {
        setTimeout(() => checkUpdates(watchedState), 5000);
      }
      watchedState.form.processState = 'finished';
    })
    .catch((err) => {
      const errType = err.message === 'notValidRss' ? 'rss' : 'network';
      watchedState.form.error = errType;
      watchedState.form.processState = 'failed';
    });
};

export default () => {
  i18next.init({
    lng: 'ru',
    debug: false,
    resources,
  });

  const state = {
    form: {
      processState: 'filling',
      valid: true,
      error: '',
    },
    feeds: [],
    posts: {
      links: [],
      dscrs: {},
      read: [],
      count: 0,
    },
  };

  const form = document.querySelector('.rss-form');
  const watchedState = buildWatchedState(state);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const value = formData.get('url');

    validate(watchedState, value);

    if (watchedState.form.valid) {
      console.log(watchedState.form.valid);
      watchedState.form.processState = 'sending';
      loadFeed(watchedState, value);
    } else {
      watchedState.form.processState = 'failed';
    }
  });
};
