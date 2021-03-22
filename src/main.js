/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales/ru.js';
import buildWatchedState from './view.js';

const schema = yup.string().url().required();

const validate = (watchedState, value) => {
  if (watchedState.links.indexOf(value) !== -1) {
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

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  if (doc.querySelector('parsererror')) {
    const errorText = doc.querySelector('parsererror > div').innerHTML;
    throw new Error(errorText);
  } else {
    const feedTitle = doc.querySelector('title').innerHTML;
    const feedDscr = doc.querySelector('description').innerHTML;
    const items = doc.querySelectorAll('item');

    const postsData = Array.from(items).map((item) => {
      const title = item.querySelector('title').innerHTML;
      const descr = item.querySelector('description').innerHTML;
      const link = item.querySelector('link').innerHTML;
      return { title, descr, link };
    });

    return {
      feeds: [{ title: feedTitle, descr: feedDscr }],
      posts: postsData,
    };
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
  watchedState.links.forEach((link) => {
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
      .then(() => setTimeout(() => checkUpdates(watchedState), 5000));
  });
};

const loadFeed = (watchedState, value) => {
  axios
    .get(buildUrl(value))
    .then((response) => {
      const data = parse(response.data.contents);
      watchedState.data.feeds = [...watchedState.data.feeds, ...data.feeds];
      watchedState.data.posts = [...watchedState.data.posts, ...data.posts];
    })
    .then(() => {
      watchedState.links.push(value);
      watchedState.form.processState = 'finished';
    })
    .catch((err) => {
      const errType = err.isAxiosError ? 'network' : 'rss';
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
    links: [],
    newDoc: null,
    data: {
      feeds: [],
      posts: [],
    },
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

    validate(watchedState, value);

    if (watchedState.form.valid) {
      watchedState.form.processState = 'sending';
      loadFeed(watchedState, value);
    } else {
      watchedState.form.processState = 'failed';
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
