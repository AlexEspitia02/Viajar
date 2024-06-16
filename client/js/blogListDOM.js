function displayBlogList(data) {
  const blogListContainer = document.getElementById('blogList');
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
    blogBox.appendChild(blogContent);

    const firstImageBlock = blog.blocks.find(block => block.type === 'image');
    const imageUrl = firstImageBlock.data.file.url;

    const blogUrl = document.createElement('a');
    blogUrl.href = `/dist/blog.html?id=${blog._id}&title=${encodeURIComponent(blog.title)}`;

    const blogImg = document.createElement('img');
    blogImg.src = imageUrl;
    blogUrl.appendChild(blogImg);
    blogBox.appendChild(blogUrl);

    blogListContainer.appendChild(blogBox);
  });
}
  
document.getElementById('submit').addEventListener('click', function() {
  const keyword = document.getElementById('search').value;
  if (keyword) {
    fetch(`/api/blogList/search?keyword=${encodeURIComponent(keyword)}`)
      .then(response => response.json())
      .then(data => {
        const blogListContainer = document.getElementById('blogList');
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
          blogBox.appendChild(blogContent);
  
          const firstImageBlock = blog.blocks.find(block => block.type === 'image');
          const imageUrl = firstImageBlock.data.file.url;
  
          const blogUrl = document.createElement('a');
          blogUrl.href = `/dist/blog.html?id=${blog._id}&title=${encodeURIComponent(blog.title)}`;
  
          const blogImg = document.createElement('img');
          blogImg.src = imageUrl;
          blogUrl.appendChild(blogImg);
          blogBox.appendChild(blogUrl);
  
          blogListContainer.appendChild(blogBox);
        });
      })
      .catch(error => {
          console.error('Error fetching data:', error);
          document.getElementById('results').textContent = '搜索失敗';
      });
  } else {
      alert('請輸入搜索關鍵字');
  }
});

window.onload = function () {
  fetch('/api/blogList')
    .then((response) => response.json())
    .then((data) => displayBlogList(data))
    .catch((error) => console.error('Error fetching data:', error));
};