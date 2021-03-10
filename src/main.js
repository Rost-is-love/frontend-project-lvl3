/* eslint-disable no-param-reassign */
import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
// prettier-ignore
import {
  render,
  renderError,
  renderSuccess,
  createNewPost,
} from './render.js';
import createModal from './modal.js';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const parse = (data) => {
  if (!data.startsWith('<?xml')) {
    throw new Error('notValidRss');
  }
  const parser = new DOMParser();
  return parser.parseFromString(data, 'application/xml');
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
      .then(() => createModal(watchedState));
  });
  setTimeout(() => checkUpdates(watchedState), 5000);
};

export default () => {
  i18next.init({
    lng: 'ru',
    debug: false,
    resources: {
      ru: {
        translation: {
          errorMessages: {
            rss: 'Ресурс не содержит валидный RSS',
            network: 'Ошибка сети',
            url: 'Ссылка должна быть валидным URL',
            feeds: 'RSS уже существует',
          },
          successMessages: {
            feeds: 'RSS успешно загружен',
          },
          buttons: {
            post: 'Просмотр',
          },
          titles: {
            feeds: 'Фиды',
            posts: 'Посты',
          },
        },
      },
    },
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
      empty: true,
    },
    posts: {
      links: [],
      dscrs: {},
      read: [],
    },
  };

  const form = document.querySelector('.rss-form');
  const input = document.querySelector('[aria-label="url"]');
  const submitButton = document.querySelector('[aria-label="add"]');

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
        renderSuccess(input, i18next.t('successMessages.feeds'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value);
        break;
      case 'form.error':
      case 'form.processError':
        renderError(input, value);
        break;
      default:
        break;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.form.processState = 'sending';
    const { value } = input;

    if (watchedState.feeds.links.indexOf(value) !== -1) {
      watchedState.form.processState = 'failed';
      watchedState.form.processError = i18next.t('errorMessages.feeds');
    } else {
      watchedState.form.fields.url = value;
      updateValidationState(watchedState);

      if (_.isEqual(watchedState.form.error, '')) {
        console.log(value, '1');
        axios
          .get(buildUrl(value), { timeout: 5000 })
          .then((response) => {
            console.log(response, '2');
            console.log(response.data.contents);
            const doc = parse(response.data.contents);
            // console.log(response, doc);
            /* if (doc.querySelector('parsererror')) {
              console.log('ошика парсинга 1');
              throw new Error('notValidRss');
            } else { */
            watchedState.feeds.links.push(value);
            // }
            return doc;
          })
          .then((doc) => {
            render(doc, watchedState);
            setTimeout(() => checkUpdates(watchedState), 5000);
          })
          .then(() => createModal(watchedState))
          .catch((err) => {
            console.log(err);
            // prettier-ignore
            const message = err.message === 'notValidRss'
              ? i18next.t('errorMessages.rss')
              : i18next.t('errorMessages.network');
            watchedState.form.processError = message;
            watchedState.form.processState = 'failed';
            console.log('ошика парсинга 2');
            throw new Error(err);
          });
      } else {
        watchedState.form.processState = 'failed';
      }
    }
  });
};
