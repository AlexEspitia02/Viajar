let currentSlide = 0;
const slidesToShow = 4;
let totalSlides = document.querySelectorAll('.blogBox').length;
const carouselInner = document.querySelector('.carousel-inner');

function updateCarousel() {
    const offset = currentSlide * -(100 / slidesToShow) * slidesToShow;
    carouselInner.style.transform = `translateX(${offset}%)`;
}

function nextSlide() {
    if ((currentSlide + 1) * slidesToShow < totalSlides) {
        currentSlide++;
        updateCarousel();
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        updateCarousel();
    }
}

updateCarousel();

const header = document.getElementById('header');
let isScrolled = false;
let isOpen = false;

window.addEventListener('scroll', () => {
  if (window.scrollY >= 48) {
    isScrolled = true;
    header.classList.add('scrolled');
  } else {
    isScrolled = false;
    header.classList.remove('scrolled');
  }
});

function scrollToSection(section) {
  const element = document.getElementById(section);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

document.querySelector('.cta-button').addEventListener('click', () => {
  window.location.href = '/';
});

onloadBlogListForm ()

function onloadBlogListForm () {
  document.querySelector('.loadingIndicator').style.display = 'flex';
  fetch(`/api/blogList/global/search`)
    .then((response) => response.json())
    .then((data) => {
      displayBlogList(data);
      document.querySelector('.loadingIndicator').style.display = 'none';
    })
    .catch((error) => console.error('Error fetching data:', error));
};

function displayBlogList(data) {
  const blogListContainer = document.getElementById('carousel-inner');
  blogListContainer.innerHTML = '';
  data.forEach((blog) => {
    const blogBox = document.createElement('div');
    blogBox.className = 'blogBox'
    const blogContent = document.createElement('div');
    blogContent.className = 'blogContent'

    const blogTitle = document.createElement('div');
    blogTitle.className = 'blogTitle';
    blogTitle.innerText = blog.title;

    const allParagraphBlocks = blog.blocks.filter(block => block.type === 'paragraph');

    const paragraph = document.createElement('div');
    paragraph.className = 'paragraph';

    allParagraphBlocks.forEach(paragraphBlock => {
        const paragraphContent = paragraphBlock.data.text;
        paragraph.innerHTML += `${paragraphContent}<br>`;
    });

    blogContent.appendChild(blogTitle);
    blogContent.appendChild(paragraph);

    const firstImageBlock = blog.blocks.find(block => block.type === 'image');
    const imageUrl = firstImageBlock.data.file.url;

    const blogUrl = document.createElement('a');
    blogUrl.href = `/dist/blog.html?id=${blog._id}&title=${encodeURIComponent(blog.title)}&mapId=${blog.mapId}`;

    const blogImg = document.createElement('img');
    blogImg.src = imageUrl;
    blogUrl.appendChild(blogImg);
    blogBox.appendChild(blogUrl);

    blogBox.appendChild(blogContent);
    blogListContainer.appendChild(blogBox);
  });

  totalSlides = document.querySelectorAll('.blogBox').length;
  updateCarousel();
}