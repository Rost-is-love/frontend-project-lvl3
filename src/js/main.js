/* eslint-disable no-param-reassign */
import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import { render, renderError, renderSuccess } from './render.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.html';
import '../style.css';

const runApp = async () => {
  await i18next.init({
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
};

runApp();

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
        .then((doc) => render(doc, watchedState))
        .catch((err) => {
          watchedState.form.processError = i18next.t('errorMessages.network');
          watchedState.form.processState = 'failed';
          throw err;
        });
    }
  }
});
