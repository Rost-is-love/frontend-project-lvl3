/* eslint-disable no-param-reassign */
import _ from 'lodash';
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

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('notValidRss');
  }
  return doc;
};

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return '';
  } catch {
    return i18next.t('errorMessages.url');
  }
};

const updateValidationState = (watchedState) => {
  const error = validate(watchedState.form.fields);
  watchedState.form.valid = _.isEqual(error, '');
  watchedState.form.error = error;
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
  watchedState.feeds.links.forEach((link) => {
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

export default () => {
  i18next.init({
    lng: 'ru',
    debug: false,
    resources,
  });

  const state = {
    form: {
      processState: 'filling',
      processError: null,
      fields: {
        url: '',
      },
      valid: true,
      error: '',
    },
    feeds: {
      links: [],
    },
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

    if (watchedState.feeds.links.indexOf(value) !== -1) {
      watchedState.form.processState = 'failed';
      watchedState.form.processError = i18next.t('errorMessages.feeds');
    } else {
      watchedState.form.fields.url = value;
      updateValidationState(watchedState);

      if (_.isEqual(watchedState.form.error, '')) {
        watchedState.form.processState = 'sending';
        axios
          .get(buildUrl(value))
          .then((response) => {
            const doc = parse(response.data.contents);
            watchedState.feeds.links.push(value);
            return doc;
          })
          .then((doc) => {
            render(doc, watchedState);
            if (watchedState.feeds.links.length === 1) {
              setTimeout(() => checkUpdates(watchedState), 5000);
            }
          })
          .then(() => {
            createModal(watchedState);
            watchedState.form.processState = 'finished';
          })
          .catch((err) => {
            // prettier-ignore
            const message = err.message === 'notValidRss'
              ? i18next.t('errorMessages.rss')
              : i18next.t('errorMessages.network');
            watchedState.form.processError = message;
            watchedState.form.processState = 'failed';
          });
      } else {
        watchedState.form.processState = 'failed';
      }
    }
  });
};
