/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import resources from './locales/ru.js';
import buildWatchedState from './view.js';

const schema = yup.string().url().required();

const validate = (value, curFeedsUrls) => {
  const expandedScheme = schema.notOneOf(curFeedsUrls);
  try {
    expandedScheme.validateSync(value, { abortEarly: false });
    return null;
  } catch (e) {
    const errType = e.message === 'this must be a valid URL' ? 'url' : 'feeds';
    return errType;
  }
};

const parse = (data, feedUrl) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('parsererror')) {
    // const errorText = doc.querySelector('parsererror > div').innerHTML;
    throw new Error('Parsing error');
  }

  const feedTitle = doc.querySelector('title').innerHTML;
  const feedDscr = doc.querySelector('description').innerHTML;
  const itemsEl = doc.querySelectorAll('item');

  const items = Array.from(itemsEl).map((item) => {
    const title = item.querySelector('title').innerHTML;
    const description = item.querySelector('description').innerHTML;
    const link = item.querySelector('link').innerHTML;
    return { title, description, link };
  });

  return {
    feeds: [{ title: feedTitle, description: feedDscr, url: feedUrl }],
    posts: items,
  };
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

const getErrorType = (err) => {
  if (err.isAxiosError) {
    return 'network';
  }
  if (err.message.startsWith('Parsing error')) {
    return 'rss';
  }

  console.log(err);
};

const checkUpdates = (watchedState) => {
  const requestes = watchedState.feeds.map((feed) => axios.get(buildUrl(feed.url)));
  Promise.all(requestes).then((response) => {
    const newPosts = response.flatMap((feed) => {
      const data = parse(feed.data.contents);
      return _.differenceWith(data.posts, watchedState.posts, _.isEqual);
    });
    if (newPosts.length !== 0) {
      watchedState.posts = [...watchedState.posts, ...newPosts];
    }
    setTimeout(() => checkUpdates(watchedState), 5000);
  });
};

const loadFeed = (watchedState, value) => {
  watchedState.form.processState = 'sending';
  axios
    .get(buildUrl(value))
    .then((response) => {
      const data = parse(response.data.contents, value);
      watchedState.feeds = [...watchedState.feeds, ...data.feeds];
      watchedState.posts = [...watchedState.posts, ...data.posts];
    })
    .then(() => {
      watchedState.form.processState = 'finished';
    })
    .catch((err) => {
      const errType = getErrorType(err);
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
      error: null,
    },
    feeds: [],
    posts: [],
    uiState: {
      modalPostId: null,
      readedPosts: [],
    },
  };

  const form = document.querySelector('.rss-form');
  const watchedState = buildWatchedState(state);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const value = formData.get('url');
    const curFeedsUrls = watchedState.feeds.map(({ url }) => url);

    const error = validate(value, curFeedsUrls);

    if (error) {
      watchedState.form.valid = false;
      watchedState.form.error = error;
    } else {
      loadFeed(watchedState, value);
    }
  });

  const posts = document.querySelector('.posts');
  posts.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-target')) {
      const curPostId = e.target.getAttribute('data-id');
      watchedState.uiState.modalPostId = curPostId;
    }
  });

  setTimeout(() => checkUpdates(watchedState), 5000);
};
