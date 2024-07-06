let loginUserId

initializeBlogListUser();
onloadBlogListForm ();

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
}
  
document.getElementById('submit').addEventListener('click', function() {
  const keyword = document.getElementById('search').value;
  document.querySelector('.loadingIndicator').style.display = 'flex';
  fetch(`/api/blogList/global/search?keyword=${encodeURIComponent(keyword)}`)
    .then(response => response.json())
    .then(data => {
      if(data.success === false){
        showAlert(data.error);
        document.querySelector('.loadingIndicator').style.display = 'none';
      } else {
        displayBlogList(data);
        document.querySelector('.loadingIndicator').style.display = 'none';
      }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('results').textContent = '搜索失敗';
    });
});

document.getElementById('ownSubmit').addEventListener('click', function() {
  const keyword = document.getElementById('search').value;
  document.querySelector('.loadingIndicator').style.display = 'flex';
  fetch(`/api/blogList/own/search?loginUserId=${loginUserId}&keyword=${encodeURIComponent(keyword)}`)
    .then(response => response.json())
    .then(data => {
      if(data.success === false){
        showAlert(data.error);
        document.querySelector('.loadingIndicator').style.display = 'none';
      } else {
        displayBlogList(data);
        document.querySelector('.loadingIndicator').style.display = 'none';
      }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        document.getElementById('results').textContent = '搜索失敗';
    });
});

async function initializeBlogListUser() {
  const isHomepage = false;
  loginUserId = await checkGoogleLoginStatus(fetchGoogleUserData, isHomepage);

  if (!loginUserId) {
      loginUserId = await checkLoginStatus(fetchUserData, isHomepage);
  }
}


function onloadBlogListForm () {
  document.querySelector('.loadingIndicator').style.display = 'flex';
  fetch(`/api/blogList/global/search`)
    .then((response) => response.json())
    .then((data) => {
      displayBlogList(data)
      document.querySelector('.loadingIndicator').style.display = 'none';
    })
    .catch((error) => console.error('Error fetching data:', error));
};