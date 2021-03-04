/* eslint-disable no-param-reassign */
import _ from 'lodash';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.html';
import '../style.css';

console.log('я тут');

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

const renderError = (input, error) => {
  const feedbackEl = document.querySelector('.feedback');
  feedbackEl.classList.add('text-danger');
  feedbackEl.textContent = error;
  input.classList.add('is-invalid');
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
      // container.innerHTML = 'User Created!';
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  watchedState.form.fields.url = input.value;
  updateValidationState(watchedState);

  if (_.isEqual(watchedState.form.error, '')) {
    watchedState.form.processState = 'sending';
    try {
      const data = await axios.get(input.value);
      watchedState.form.processState = 'finished';
    } catch (err) {
      watchedState.form.processError = errorMessages.network.error;
      watchedState.form.processState = 'failed';
      throw err;
    }
  }
});
