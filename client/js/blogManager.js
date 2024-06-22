function displayBlogList(data) {
    const blogListContainer = document.getElementById('information');
    blogListContainer.innerHTML = '';
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'none'
    if (loginUserId) {
      data.forEach((blog) => {
        const blogBox = document.createElement('div');
        blogBox.className = 'blogBox'
        const blogContent = document.createElement('div');
        blogContent.className = 'blogContent'
    
        const blogTitle = document.createElement('div');
        blogTitle.className = 'blogTitle';
        blogTitle.innerText = blog.title;
    
        blogContent.appendChild(blogTitle);
        blogBox.appendChild(blogContent);
    
        const firstImageBlock = blog.blocks.find(block => block.type === 'image');
        const imageUrl = firstImageBlock.data.file.url;
    
        const blogUrl = document.createElement('a');
        blogUrl.className = 'blogUrl';
        blogUrl.href = `/dist/blog.html?id=${blog._id}&title=${encodeURIComponent(blog.title)}`;
    
        const blogImg = document.createElement('img');
        blogImg.src = imageUrl;
        blogImg.className = 'blogImg';
        blogUrl.appendChild(blogImg);
        blogBox.appendChild(blogUrl);
    
        blogListContainer.appendChild(blogBox);
        });
    } else {
        const contentDiv = document.getElementById("information");
        contentDiv.innerHTML = `登入後查看文章清單`;
        contentDiv.style.display = 'flex';
    }
}