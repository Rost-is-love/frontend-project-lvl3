export default (watchedState) => {
  const btns = document.querySelectorAll('[data-target="#modal"]');
  btns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const titleEl = btn.previousSibling;
      const titleText = titleEl.innerHTML;
      const titleLink = titleEl.getAttribute('href');
      const descr = watchedState.posts.dscrs[id];
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      const modalLink = document.querySelector('div.modal-footer > a');

      modalTitle.textContent = titleText;
      modalBody.textContent = descr;
      modalLink.setAttribute('href', titleLink);

      if (watchedState.posts.read.indexOf(id) === -1) {
        titleEl.classList.remove('font-weight-bold');
        titleEl.classList.add('font-weight-normal');
        watchedState.posts.read.push(id);
      }
    });
  });
};
