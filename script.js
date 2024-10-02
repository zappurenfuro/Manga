// script.js

// Select DOM Elements
const addMangaBtn = document.getElementById('addMangaBtn');
const mangaModal = document.getElementById('mangaModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const mangaForm = document.getElementById('mangaForm');
const mangaListEl = document.getElementById('mangaList');
const modalTitleEl = document.getElementById('modalTitle');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');

const sortAddedBtn = document.getElementById('sortAddedBtn');
const sortUpdatedBtn = document.getElementById('sortUpdatedBtn');
const sortPriorityBtn = document.getElementById('sortPriorityBtn');

// Form Inputs
const titleInput = document.getElementById('titleInput');
const chaptersInput = document.getElementById('chaptersInput');
const priorityInput = document.getElementById('priorityInput');

// Application State
let mangaList = [];
let editMode = false;
let editId = null;
let sortState = {
    added: null,
    updated: null,
    priority: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Load manga list from localStorage
    const storedMangaList = localStorage.getItem('mangaList');
    if (storedMangaList) {
        mangaList = JSON.parse(storedMangaList);
        renderMangaList();
    }
});

// Event Listeners
addMangaBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
mangaForm.addEventListener('submit', saveManga);
downloadBtn.addEventListener('click', downloadList);
uploadBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', uploadList);

sortAddedBtn.addEventListener('click', () => sortMangaList('added'));
sortUpdatedBtn.addEventListener('click', () => sortMangaList('updated'));
sortPriorityBtn.addEventListener('click', () => sortMangaList('priority'));

// Functions

function openAddModal() {
    editMode = false;
    editId = null;
    modalTitleEl.textContent = 'Add Manga';
    titleInput.value = '';
    chaptersInput.value = 1;
    priorityInput.value = 1;
    mangaModal.style.display = 'block';
}

function openEditModal(manga) {
    editMode = true;
    editId = manga.id;
    modalTitleEl.textContent = 'Edit Manga';
    titleInput.value = manga.title;
    chaptersInput.value = manga.chapters;
    priorityInput.value = manga.priority;
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
                    lastUpdated: timestamp
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
            lastUpdated: timestamp
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
    // Clear existing list
    mangaListEl.innerHTML = '';

    // Create list items
    mangaList.forEach(manga => {
        const li = document.createElement('li');
        li.className = `manga-item priority-${manga.priority}`;

        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';

        const itemDetails = document.createElement('div');

        const titleEl = document.createElement('h3');
        titleEl.textContent = manga.title;

        const detailsEl = document.createElement('p');
        detailsEl.textContent = `Chapters: ${manga.chapters} | Priority: ${manga.priority} | Last Updated: ${manga.lastUpdated}`;

        itemDetails.appendChild(titleEl);
        itemDetails.appendChild(detailsEl);

        const itemActions = document.createElement('div');
        itemActions.className = 'item-actions';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit-btn';
        editBtn.addEventListener('click', () => openEditModal(manga));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => deleteManga(manga.id));

        itemActions.appendChild(editBtn);
        itemActions.appendChild(deleteBtn);

        itemContent.appendChild(itemDetails);
        itemContent.appendChild(itemActions);

        li.appendChild(itemContent);
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
    reader.onload = function(e) {
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
    switch(type) {
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
    // Reset other sort states
    for (let k in sortState) {
        if (k !== key) sortState[k] = null;
    }
    // Toggle sort direction
    if (sortState[key] === null) {
        sortState[key] = 'asc';
    } else if (sortState[key] === 'asc') {
        sortState[key] = 'desc';
    } else {
        sortState[key] = null;
        // Reset to default order
        mangaList = mangaList.sort((a, b) => a.id - b.id);
    }
}
