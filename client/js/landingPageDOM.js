document.querySelector('.cta-button').addEventListener('click', () => {
  window.location.href = '/';
});
  
document.querySelector('.homeBtn').addEventListener('click', () => {
  window.scrollTo({
    top: document.querySelector('#home').offsetTop,
    behavior: 'smooth'
  });
});

document.querySelector('.aboutBtn').addEventListener('click', () => {
  window.scrollTo({
    top: document.querySelector('#about').offsetTop,
    behavior: 'smooth'
  });
});

document.querySelector('.servicesBtn').addEventListener('click', () => {
  window.scrollTo({
    top: document.querySelector('#services').offsetTop,
    behavior: 'smooth'
  });
});

document.querySelector('.contactBtn').addEventListener('click', () => {
  window.scrollTo({
    top: document.querySelector('#contact').offsetTop,
    behavior: 'smooth'
  });
});