/* eslint-disable no-param-reassign */
import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import { render, renderError, renderSuccess } from './render.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.html';
import '../style.css';

const schema = yup.object().shape({
  url: yup.string().url().required(),
});

const errorMessages = {
  network: {
    error: 'Ресурс не содержит валидный RSS',
  },
  url: {
    error: 'Ссылка должна быть валидным URL',
  },
  feeds: {
    error: 'RSS уже существует',
  },
};

const validate = (fields) => {
  try {
    schema.validateSync(fields, { abortEarly: false });
    return '';
  } catch {
    return errorMessages.url.error;
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
    data: {},
  },
  feeds: {
    data: [],
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
      renderSuccess(input);
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
    case 'form.data':
      render(value.data, watchedState);
      break;
    default:
      break;
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const { value } = input;

  if (watchedState.feeds.data.indexOf(value) !== -1) {
    watchedState.form.processError = errorMessages.feeds.error;
  } else {
    watchedState.form.fields.url = value;
    updateValidationState(watchedState);

    if (_.isEqual(watchedState.form.error, '')) {
      watchedState.feeds.data.push(value);
      watchedState.form.processState = 'sending';
      try {
        const url = new URL(
          `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(value)}`,
        );
        axios
          .get(url)
          // eslint-disable-next-line no-return-assign
          .then((response) => (watchedState.form.data = response));
        /* const data = await axios({
          method: 'get',
          url: `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(value)}`,
          data: {
            status: {
              content_type: null,
            },
          },
        }); */
      } catch (err) {
        watchedState.form.processError = errorMessages.network.error;
        watchedState.form.processState = 'failed';
        throw err;
      }
    }
  }
});
