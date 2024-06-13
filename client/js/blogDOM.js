import EditorJs from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Embed from '@editorjs/embed';
import ImageTool from '@editorjs/image';

let editor;

document.addEventListener('DOMContentLoaded', function () {

    editor = new EditorJs({
        holder: 'editorjs',
        
        tools:{
            header: {
                class: Header,
                inlineToolbar:['link']
            },
            list: {
                class: List,
                inlineToolbar:[
                    'link',
                    'bold',
                ]
            },
            embed: {
                class: Embed,
                inlineToolbar: false,
                config:{
                    services: {
                        youtube: true,
                        coub: true
                    }
                }
            },
            image: {
                class: ImageTool,
                config: {
                    endpoints: {
                        byFile: '/api/upload',
                        byUrl: 'http://localhost:8008/fetchUrl',
                    }
                }
            }
        }
    });
    loadEditorData();
});

function loadEditorData() {
    fetch('/api/posts')
        .then(response => response.json())
        .then(data => {
            editor.isReady
                .then(() => {
                    editor.render(data[0]);
                })
                .catch(error => {
                    console.error('Error loading the post:', error);
                });
        });
}

let saveBtn = document.querySelector('button');
saveBtn.addEventListener('click', function() {
    editor.save().then((outputData) => {
        const formData = new FormData();
        formData.append('data', JSON.stringify(outputData));
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput.files[0]) {
            formData.append('main_image', fileInput.files[0]);
        }

        fetch("/api/posts", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Something went wrong on api server!');
            }
        })
        .then(data => {
            alert("數據上傳成功");
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert("數據上傳失敗");
        });
    }).catch((error) => {
        console.log('Saving failed', error);
    });
});
