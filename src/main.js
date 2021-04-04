/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import resources from './locales/ru.js';
import buildWatchedState from './view.js';

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('parsererror')) {
    const error = new Error(`Parsing error: ${doc.querySelector('parsererror').innerHTML}`);
    error.isParsingError = true;
    throw error;
  }

  const feedTitle = doc.querySelector('title').textContent;
  const feedDscr = doc.querySelector('description').textContent;
  const itemsEl = doc.querySelectorAll('item');

  const items = Array.from(itemsEl).map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return {
      title,
      description,
      link,
    };
  });

  return { title: feedTitle, description: feedDscr, items };
};

// prettier-ignore
const normalize = (data, feedUrl, id = null) => {
  const feedId = id ?? _.uniqueId();
  const posts = data.items.map((item) => {
    const { title, description, link } = item;
    const postId = _.uniqueId();
    return {
      title,
      description,
      link,
      feedId,
      id: postId,
    };
  });

  return {
    feed: [{
      title: data.title,
      description: data.description,
      url: feedUrl,
      feedId,
    }],
    posts,
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
  if (err.isParsingError) {
    return 'rss';
  }

  return 'undefined';
};

const checkUpdates = (watchedState) => {
  const { feeds } = watchedState;
  // prettier-ignore
  const promises = feeds.map((feed) => axios.get(buildUrl(feed.url))
    .then((response) => {
      const roughData = parse(response.data.contents);
      const data = normalize(roughData, feed.url, feed.feedId);
      const curFeedPosts = watchedState.posts.filter((post) => feed.feedId === post.feedId);
      const newPosts = _.differenceBy(data.posts, curFeedPosts, 'link');
      watchedState.posts = [...newPosts, ...watchedState.posts];
    })
    .catch((e) => console.log(e)));
  Promise.all(promises).finally(() => {
    setTimeout(() => checkUpdates(watchedState), 5000);
  });
};

const loadFeed = (watchedState, value) => {
  watchedState.form.processState = 'sending';
  axios
    .get(buildUrl(value))
    .then((response) => {
      const roughData = parse(response.data.contents);
      const data = normalize(roughData, value);
      watchedState.feeds = [...watchedState.feeds, ...data.feed];
      watchedState.posts = [...data.posts, ...watchedState.posts];
      watchedState.form.processState = 'finished';
    })
    .catch((err) => {
      console.log(err);
      const errType = getErrorType(err);
      watchedState.form.error = errType;
      watchedState.form.processState = 'failed';
    });
};

export default () => {
  const texts = i18next.createInstance();
  texts
    .init({
      lng: 'ru',
      debug: false,
      resources,
    })
    .then(() => {
      yup.setLocale({
        string: {
          url: () => ({ key: 'url' }),
        },
        mixed: {
          notOneOf: () => ({ key: 'feeds' }),
        },
      });

      const state = {
        form: {
          processState: 'filling',
          valid: false,
          error: null,
        },
        feeds: [],
        posts: [],
        uiState: {
          modalPostId: null,
          readedPosts: [],
        },
      };

      const elements = {
        form: document.querySelector('.rss-form'),
        input: document.querySelector('[aria-label="url"]'),
        submitButton: document.querySelector('[aria-label="add"]'),
        feedsEl: document.querySelector('.feeds'),
        postsEl: document.querySelector('.posts'),
        feedbackEl: document.querySelector('.feedback'),
        modalTitle: document.querySelector('.modal-title'),
        modalBody: document.querySelector('.modal-body'),
        modalLink: document.querySelector('div.modal-footer > a'),
      };

      const schema = yup.string().url();

      const validate = (value, curFeedsUrls) => {
        const expandedScheme = schema.notOneOf(curFeedsUrls);
        try {
          expandedScheme.validateSync(value);
          return null;
        } catch (e) {
          const { key } = e.message;
          return key;
        }
      };

      const watchedState = buildWatchedState(state, elements, texts);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const value = formData.get('url');
        const curFeedsUrls = watchedState.feeds.map(({ url }) => url);

        const error = validate(value, curFeedsUrls);

        if (error) {
          watchedState.form.valid = false;
          watchedState.form.error = error;
        } else {
          watchedState.form.valid = true;
          loadFeed(watchedState, value);
        }
      });

      elements.postsEl.addEventListener('click', (e) => {
        if ('id' in e.target.dataset) {
          const curPostId = e.target.getAttribute('data-id');
          watchedState.uiState.modalPostId = curPostId;
        }
      });

      setTimeout(() => checkUpdates(watchedState), 5000);
    });
};
