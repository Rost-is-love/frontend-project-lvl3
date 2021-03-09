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
import 'bootstrap/js/dist/modal';
import '../style.scss';

i18next.init({
  lng: 'ru',
  debug: false,
  resources: {
    ru: {
      translation: {
        errorMessages: {
          network: 'Ресурс не содержит валидный RSS',
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

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const parse = (data) => {
  const parser = new DOMParser();
  return parser.parseFromString(data, 'text/xml');
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

const checkUpdates = (watchedState) => {
  watchedState.feeds.links.forEach((link) => {
    axios
      .get(`https://hexlet-allorigins.herokuapp.com/raw?url=${link}`)
      .then((response) => {
        const doc = parse(response.data);
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
const submitButton = document.querySelector('.btn');

const processStateHandler = (processState) => {
  switch (processState) {
    case 'failed':
      submitButton.disabled = false;
      break;
    case 'filling':
      submitButton.disabled = false;
      break;
    case 'sending':
      submitButton.disabled = true;
      break;
    case 'finished':
      submitButton.disabled = false;
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

  const { value } = input;

  if (watchedState.feeds.links.indexOf(value) !== -1) {
    watchedState.form.processError = i18next.t('errorMessages.feeds');
  } else {
    watchedState.form.fields.url = value;
    updateValidationState(watchedState);

    if (_.isEqual(watchedState.form.error, '')) {
      watchedState.form.processState = 'sending';
      axios
        .get(`https://hexlet-allorigins.herokuapp.com/raw?url=${value}`)
        .then((response) => {
          const doc = parse(response.data);
          if (doc.querySelector('parsererror')) {
            throw new Error(i18next.t('errorMessages.network'));
          } else {
            watchedState.feeds.links.push(value);
          }
          return doc;
        })
        .then((doc) => {
          render(doc, watchedState);
          setTimeout(() => checkUpdates(watchedState), 5000);
        })
        .then(() => createModal(watchedState))
        .catch((err) => {
          watchedState.form.processError = i18next.t('errorMessages.network');
          watchedState.form.processState = 'failed';
          throw err;
        });
    }
  }
});
