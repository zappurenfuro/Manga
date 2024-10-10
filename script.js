let mangaList = [];
let isThumbnailMode = true;
let editMode = false;
let editId = null;
let sortState = {
    added: null,
    updated: null,
    priority: null
};

// Elements
const addMangaBtn = document.getElementById('addMangaBtn');
const mangaModal = document.getElementById('mangaModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const mangaForm = document.getElementById('mangaForm');
const mangaListEl = document.getElementById('mangaList');
const modalTitleEl = document.getElementById('modalTitle');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
const compactModeBtn = document.getElementById('compactModeBtn');
const thumbnailModeBtn = document.getElementById('thumbnailModeBtn');
const uploadThumbnailBtn = document.getElementById('uploadThumbnailBtn');


const sortAddedBtn = document.getElementById('sortAddedBtn');
const sortUpdatedBtn = document.getElementById('sortUpdatedBtn');
const sortPriorityBtn = document.getElementById('sortPriorityBtn');

// Form Inputs
const titleInput = document.getElementById('titleInput');
const chaptersInput = document.getElementById('chaptersInput');
const priorityInput = document.getElementById('priorityInput');

// Thumbnail upload elements
const thumbnailInput = document.getElementById('thumbnailInput');
const uploadStatus = document.getElementById('uploadStatus');
const uploadedImage = document.getElementById('uploadedImage');

// Sidebar Buttons Event Listeners
document.getElementById('sidebarAddMangaBtn').addEventListener('click', openAddModal);
document.getElementById('sidebarCompactModeBtn').addEventListener('click', () => setMode(false));
document.getElementById('sidebarThumbnailModeBtn').addEventListener('click', () => setMode(true));
document.getElementById('sidebarSortAddedBtn').addEventListener('click', () => sortMangaList('added'));
document.getElementById('sidebarSortUpdatedBtn').addEventListener('click', () => sortMangaList('updated'));
document.getElementById('sidebarSortPriorityBtn').addEventListener('click', () => sortMangaList('priority'));
document.getElementById('sidebarDownloadBtn').addEventListener('click', downloadList);
document.getElementById('sidebarUploadBtn').addEventListener('click', () => uploadInput.click());

// Thumbnail URL state
let uploadedThumbnailUrl = '';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    const storedMangaList = localStorage.getItem('mangaList');
    if (storedMangaList) {
        mangaList = JSON.parse(storedMangaList);
        renderMangaList();
    }
    setMode(true);
});

// Event Listeners
addMangaBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
mangaForm.addEventListener('submit', saveManga);
downloadBtn.addEventListener('click', downloadList);
uploadBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', uploadList);
compactModeBtn.addEventListener('click', () => setMode(false));
thumbnailModeBtn.addEventListener('click', () => setMode(true));
uploadThumbnailBtn.addEventListener('click', handleThumbnailUpload);

// Sort Buttons Event Listeners
sortAddedBtn.addEventListener('click', () => sortMangaList('added'));
sortUpdatedBtn.addEventListener('click', () => sortMangaList('updated'));
sortPriorityBtn.addEventListener('click', () => sortMangaList('priority'));

// Thumbnail upload button function
async function handleThumbnailUpload() {
    const file = thumbnailInput.files[0];
    if (!file) {
        alert('Please select an image first');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_upload');

    try {
        uploadStatus.textContent = 'Uploading...';
        uploadThumbnailBtn.disabled = true;

        const response = await fetch('https://api.cloudinary.com/v1_1/dzvzxvotk/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();

        if (data.secure_url) {
            uploadStatus.textContent = 'Upload successful!';
            uploadedImage.src = data.secure_url;
            uploadedImage.style.display = 'block';
            uploadedThumbnailUrl = data.secure_url;
        } else {
            throw new Error('No URL in response');
        }
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        uploadStatus.textContent = 'Upload failed. Please try again.';
        uploadedImage.style.display = 'none';
        uploadedThumbnailUrl = '';
    } finally {
        uploadThumbnailBtn.disabled = false;
    }
}

// Functions
function setMode(thumbnail) {
    isThumbnailMode = thumbnail;
    if (isThumbnailMode) {
        mangaListEl.classList.remove('compact-mode');
        mangaListEl.classList.add('thumbnail-mode');
    } else {
        mangaListEl.classList.remove('thumbnail-mode');
        mangaListEl.classList.add('compact-mode');
    }
    renderMangaList();
}

function openAddModal() {
    editMode = false;
    editId = null;
    modalTitleEl.textContent = 'Add Manga';
    titleInput.value = '';
    chaptersInput.value = 1;
    priorityInput.value = 1;
    uploadedThumbnailUrl = '';
    uploadedImage.style.display = 'none';

    mangaModal.style.display = 'block';
}

function openEditModal(manga) {
    editMode = true;
    editId = manga.id;
    modalTitleEl.textContent = 'Edit Manga';
    titleInput.value = manga.title;
    chaptersInput.value = manga.chapters;
    priorityInput.value = manga.priority;
    uploadedThumbnailUrl = manga.thumbnail || '';
    if (uploadedThumbnailUrl) {
        uploadedImage.src = uploadedThumbnailUrl;
        uploadedImage.style.display = 'block';
    } else {
        uploadedImage.style.display = 'none';
    }

    mangaModal.style.display = 'block';
}

function closeModal() {
    mangaModal.style.display = 'none';
}

function saveManga(e) {
    e.preventDefault();

    const title = titleInput.value.trim();
    const chapters = parseInt(chaptersInput.value);
    const priority = parseInt(priorityInput.value);
    const timestamp = new Date().toLocaleString();

    if (!title) {
        alert('Please enter a title.');
        return;
    }

    if (editMode) {
        // Update existing manga
        mangaList = mangaList.map(manga => {
            if (manga.id === editId) {
                return {
                    ...manga,
                    title,
                    chapters,
                    priority,
                    lastUpdated: timestamp,
                    thumbnail: uploadedThumbnailUrl
                };
            }
            return manga;
        });
    } else {
        // Add new manga
        const newManga = {
            id: Date.now(),
            title,
            chapters,
            priority,
            timestamp,
            lastUpdated: timestamp,
            thumbnail: uploadedThumbnailUrl
        };
        mangaList.push(newManga);
    }

    // Save to localStorage
    localStorage.setItem('mangaList', JSON.stringify(mangaList));

    // Close modal and reset form
    closeModal();
    mangaForm.reset();

    // Re-render manga list
    renderMangaList();
}

function renderMangaList() {
    mangaListEl.innerHTML = '';

    mangaList.forEach(manga => {
        const li = document.createElement('li');
        li.className = `manga-item priority-${manga.priority}`;

        if (isThumbnailMode) {
            // Thumbnail Image
            if (manga.thumbnail) {
                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = manga.thumbnail;
                thumbnailImg.alt = manga.title;
                li.appendChild(thumbnailImg);
            }

            // Main Content Container
            const itemContent = document.createElement('div');
            itemContent.className = 'item-content';

            // Manga Info Section
            const mangaInfo = document.createElement('div');
            mangaInfo.className = 'manga-info';

            // Priority Badge
            const priorityBadge = document.createElement('div');
            priorityBadge.className = 'priority-badge';
            priorityBadge.textContent = `Priority: ${manga.priority}`;
            mangaInfo.appendChild(priorityBadge);

            // Title
            const titleEl = document.createElement('h3');
            titleEl.textContent = manga.title;
            mangaInfo.appendChild(titleEl);

            // Details Section
            const detailsEl = document.createElement('div');
            detailsEl.className = 'manga-details';
            detailsEl.innerHTML = `
                        <span>Chapters: ${manga.chapters}</span>
                        <span>Added: ${manga.timestamp}</span>
                        <span>Updated: ${manga.lastUpdated}</span>
                    `;
            mangaInfo.appendChild(detailsEl);

            // Action Buttons
            const itemActions = document.createElement('div');
            itemActions.className = 'item-actions';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', () => openEditModal(manga));

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => deleteManga(manga.id));

            itemActions.appendChild(editBtn);
            itemActions.appendChild(deleteBtn);

            itemContent.appendChild(mangaInfo);
            itemContent.appendChild(itemActions);
            li.appendChild(itemContent);
        } else {
            // Compact mode rendering
            const itemContent = document.createElement('div');
            itemContent.className = 'item-content';

            const itemDetails = document.createElement('div');
            itemDetails.className = 'manga-info';

            const titleEl = document.createElement('h3');
            titleEl.textContent = manga.title;

            const detailsEl = document.createElement('p');
            detailsEl.textContent = `Chapters: ${manga.chapters} | Priority: ${manga.priority} | Last Updated: ${manga.lastUpdated}`;

            itemDetails.appendChild(titleEl);
            itemDetails.appendChild(detailsEl);

            const itemActions = document.createElement('div');
            itemActions.className = 'item-actions';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', () => openEditModal(manga));

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => deleteManga(manga.id));

            itemActions.appendChild(editBtn);
            itemActions.appendChild(deleteBtn);

            itemContent.appendChild(itemDetails);
            itemContent.appendChild(itemActions);
            li.appendChild(itemContent);
        }

        mangaListEl.appendChild(li);
    });
}

function deleteManga(id) {
    if (confirm('Are you sure you want to delete this Manga?')) {
        mangaList = mangaList.filter(manga => manga.id !== id);
        localStorage.setItem('mangaList', JSON.stringify(mangaList));
        renderMangaList();
    }
}

function downloadList() {
    const dataStr = JSON.stringify(mangaList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'manga_list.json';
    link.click();
}

function uploadList(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        try {
            const importedList = JSON.parse(content);
            if (Array.isArray(importedList)) {
                mangaList = importedList;
                localStorage.setItem('mangaList', JSON.stringify(mangaList));
                renderMangaList();
            } else {
                alert('Invalid file format.');
            }
        } catch (error) {
            alert('Error reading file.');
        }
    };
    reader.readAsText(file);
}

function sortMangaList(type) {
    switch (type) {
        case 'added':
            toggleSort('added');
            mangaList.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return sortState.added === 'asc' ? dateB - dateA : dateA - dateB;
            });
            break;
        case 'updated':
            toggleSort('updated');
            mangaList.sort((a, b) => {
                const dateA = new Date(a.lastUpdated);
                const dateB = new Date(b.lastUpdated);
                return sortState.updated === 'asc' ? dateB - dateA : dateA - dateB;
            });
            break;
        case 'priority':
            toggleSort('priority');
            mangaList.sort((a, b) => {
                return sortState.priority === 'asc' ? b.priority - a.priority : a.priority - b.priority;
            });
            break;
        default:
            break;
    }
    renderMangaList();
}

function toggleSort(key) {
    for (let k in sortState) {
        if (k !== key) sortState[k] = null;
    }

    if (sortState[key] === null) {
        sortState[key] = 'asc';
    } else if (sortState[key] === 'asc') {
        sortState[key] = 'desc';
    } else {
        sortState[key] = null;
    }
}