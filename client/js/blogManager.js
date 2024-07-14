function createBlogElement(blog) {
    const blogBox = document.createElement('div');
    blogBox.className = 'blogBox';

    const blogContent = document.createElement('div');
    blogContent.className = 'blogContent';

    const blogTitle = document.createElement('div');
    blogTitle.className = 'blogTitle';
    blogTitle.innerText = blog.title;

    blogContent.appendChild(blogTitle);
    blogBox.appendChild(blogContent);

    const firstImageBlock = blog.blocks.find(block => block.type === 'image');
    const imageUrl = firstImageBlock.data.file.url;

    const blogUrl = document.createElement('a');
    blogUrl.className = 'blogUrl';
    blogUrl.href = `/dist/blog.html?id=${blog._id}&title=${encodeURIComponent(blog.title)}&mapId=${blog.mapId}`;
    blogUrl.target = '_blank';

    const blogImg = document.createElement('img');
    blogImg.src = imageUrl;
    blogImg.className = 'blogImg';
    blogUrl.appendChild(blogImg);
    blogBox.appendChild(blogUrl);

    return blogBox;
}

function displayBlogList(data) {
    const blogListContainer = document.getElementById('information');
    blogListContainer.innerHTML = '';
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'flex';
    loginButtonBox.innerHTML = '';

    const blogListSearchInput = document.createElement('input');
    blogListSearchInput.setAttribute("placeholder", "搜尋文章");
    blogListSearchInput.className = 'blogListSearchInput';
    blogListSearchInput.id = 'blogListSearchInput';
    loginButtonBox.appendChild(blogListSearchInput);

    const blogListSearchBtn = document.createElement('button');
    blogListSearchBtn.className = 'blogListSearchBtn';
    blogListSearchBtn.id = 'blogListSearchBtn';
    blogListSearchBtn.innerText = '搜尋';
    loginButtonBox.appendChild(blogListSearchBtn);

    document.getElementById('blogListSearchBtn').addEventListener('click', function() {
        const blogListContainer = document.getElementById('information');
        blogListContainer.innerHTML = '';
        const keyword = document.getElementById('blogListSearchInput').value;

        const urlParams = new URLSearchParams(window.location.search);
        const mapId = urlParams.get('mapId');

        document.querySelector('.loadingIndicator').style.display = 'flex';
        
        fetch(`/api/blogList/search?keyword=${encodeURIComponent(keyword)}&mapId=${mapId}`)
            .then(response => response.json())
            .then(data => {
                if (data.success === false) {
                    showAlert(data.error);
                    document.querySelector('.loadingIndicator').style.display = 'none';
                } else {
                    data.forEach(blog => {
                        const blogElement = createBlogElement(blog);
                        blogListContainer.appendChild(blogElement);
                    });
                    document.querySelector('.loadingIndicator').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                document.getElementById('results').textContent = '搜索失敗';
            });
    });

    if (loginUserId) {
        const urlParams = new URLSearchParams(window.location.search);
        const mapId = urlParams.get('mapId');
        if (!mapId){
            loginButtonBox.style.display = 'none';
            const contentDiv = document.getElementById("information");
            contentDiv.innerHTML = `
                <div class="WithoutMapId">
                    <div>請先選擇地圖：</div>
                    <div>地圖 → 地圖清單</div>
                    <div>若無地圖，請先創建地圖：</div>
                    <div>地圖 → 創建地圖 → 輸入地圖名稱 → 確定創建 → 地圖清單</div>
                </div>
            `;
        } else {
            data.forEach(blog => {
                const blogElement = createBlogElement(blog);
                blogListContainer.appendChild(blogElement);
            });
            if (data.length === 0) {
                blogListContainer.innerHTML = `
                <div class="WithoutMapId">
                    <div>尚未建立文章，請先建立文章：</div>
                    <div>點地圖 → 打開地標 → 上傳Title和圖片 → 打開地標點擊圖片</div>
                </div>
                `;
            }
        }
    } else {
        loginButtonBox.style.display = 'none';
        const contentDiv = document.getElementById("information");
        contentDiv.innerHTML = `
        <div class="WithoutMapId">
            <div>登入後查看文章清單</div>
        </div>
        `;
        contentDiv.style.display = 'flex';
    }
}

function handleArticleListClick() {
    document.querySelector('.loadingIndicator').style.display = 'flex';

    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');

    fetch(`/api/blogList?mapId=${mapId}`)
    .then((response) => response.json())
    .then((data) => {
        displayBlogList(data);
        document.querySelector('.loadingIndicator').style.display = 'none';
    })
    .catch((error) => console.error('Error fetching data:', error));
}