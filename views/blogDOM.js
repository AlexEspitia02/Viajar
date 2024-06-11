document.addEventListener('DOMContentLoaded', function() {
    const articles = [
        {
            title: '第一篇文章',
            content: '這是第一篇文章的內容。內容非常精彩，有很多有趣的資訊。',
            image: 'https://via.placeholder.com/800x400'
        },
        {
            title: '第二篇文章',
            content: '這是第二篇文章的內容。這篇文章探討了許多有趣的主題，值得一讀。',
            image: 'https://via.placeholder.com/800x400'
        },
        {
            title: '第三篇文章',
            content: '這是第三篇文章的內容。這篇文章介紹了很多有用的知識。',
            image: 'https://via.placeholder.com/800x400'
        }
    ];
    
    const articlesContainer = document.getElementById('articles');
    
    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('article');
        
        const articleTitle = document.createElement('h2');
        articleTitle.textContent = article.title;
        articleElement.appendChild(articleTitle);
        
        const articleContent = document.createElement('p');
        articleContent.textContent = article.content;
        articleElement.appendChild(articleContent);
        
        if (article.image) {
            const articleImage = document.createElement('img');
            articleImage.src = article.image;
            articleElement.appendChild(articleImage);
        }
        
        articlesContainer.appendChild(articleElement);
    });
});
