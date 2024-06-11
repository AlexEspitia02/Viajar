document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const image = document.getElementById('image').files[0];
    
    if (title && content) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }
        
        // 模擬上傳處理
        setTimeout(() => {
            document.getElementById('message').classList.remove('hidden');
            document.getElementById('message').textContent = '文章上傳成功！';
            document.getElementById('uploadForm').reset();
        }, 1000);
    } else {
        alert('請填寫所有必填欄位！');
    }
});
