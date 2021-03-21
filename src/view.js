import i18next from 'i18next';
import onChange from 'on-change';
// prettier-ignore
import {
  render,
  renderError,
  renderSuccess,
} from './render.js';
import createModal from './modal.js';

export default (state) => {
  const input = document.querySelector('[aria-label="url"]');
  const submitButton = document.querySelector('[aria-label="add"]');

  const processStateHandler = (processState, watchedState) => {
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
        createModal(watchedState);
        renderSuccess(input, i18next.t('successMessages.feeds'));
        break;
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'form.processState':
        processStateHandler(value, watchedState);
        break;
      case 'form.error':
        renderError(input, value);
        break;
      case 'newDoc':
        render(value, watchedState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
