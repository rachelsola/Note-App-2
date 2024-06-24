import "./style.css";

customElements.define('delete-button', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .delete-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          color: #dc3545;
          cursor: pointer;
        }
      </style>
      <span class="delete-btn">❌</span>
    `;
    this.shadowRoot.querySelector('.delete-btn').addEventListener('click', async () => {
      this.dispatchEvent(new CustomEvent('delete'));
    });
  }
});


customElements.define('note-date', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const createdAt = this.getAttribute('created-at');
    const formattedDate = new Date(createdAt).toLocaleString();
    this.shadowRoot.innerHTML = `
      <style>
        .note-date {
          font-size: 0.8em;
          color: #666;
          margin-top: 5px;
        }
      </style>
      <span class="note-date">Created at: ${formattedDate}</span>
    `;
  }
});

customElements.define('note-item', class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const title = this.getAttribute('title');
    const body = this.getAttribute('body');
    const createdAt = this.getAttribute('created-at');
    const id = this.getAttribute('note-id'); // Pastikan atribut 'note-id' telah diatur dengan benar
    const hash = this.hashString(title);
    const hue = hash % 360;
    const backgroundColor = `hsl(${hue}, 70%, 80%)`;
    this.shadowRoot.innerHTML = `
      <style>
        .note {
          border: 1px solid #ccc;
          padding: 10px;
          border-radius: 5px;
          background-color: ${backgroundColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: transform 0.3s;
          max-width: 300px;
          margin: 10px;
          display: inline-block;
          vertical-align: top;
          position: relative;
        }
        .note:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h3 {
          margin-top: 0;
          color: #007bff;
          font-size: 1.2em;
          margin-bottom: 5px;
        }
        p {
          margin-bottom: 0;
          font-size: 1em;
          color: #333;
        }
        .delete-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          color: #dc3545;
          cursor: pointer;
        }
      </style>
      <div class="note">
        <h3>${title}</h3>
        <p>${body}</p>
        <span class="delete-btn">❌</span>
        <note-date created-at="${createdAt}"></note-date>
      </div>
    `;
    this.shadowRoot.querySelector('.delete-btn').addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to delete this note?');
      if (confirmed) {
        await this.deleteNote();
      }
    });
  }

  async deleteNote() {
    const id = this.getAttribute('note-id');
    const requestOptions = {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    };

    try {
      const response = await fetch(`https://notes-api.dicoding.dev/v2/notes/${id}`, requestOptions);
      if (response.ok) {
        this.remove();
      } else {
        const data = await response.json();
        console.error('Failed to delete note:', data);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }
});

const container = document.querySelector('.container');

async function makeRequest(url, options) {
  try {
    // Tampilkan indikator loading saat permintaan dimulai
    loadingIndicator.style.display = 'block';

    const response = await fetch(url, options);
    const data = await response.json();

    // Sembunyikan indikator loading saat permintaan selesai
    loadingIndicator.style.display = 'none';

    return data;
  } catch (error) {
    console.error('Error:', error);

    // Sembunyikan indikator loading saat terjadi kesalahan
    loadingIndicator.style.display = 'none';

    return null;
  }
}

document.querySelector('.form').addEventListener('submit', async function (event) {
  event.preventDefault();
  const title = document.querySelector('#title').value;
  const body = document.querySelector('#body').value;
  let isValid = true;

  if (title.trim() === '') {
    isValid = false;
    document.querySelector('#title').classList.add('error');
  } else {
    document.querySelector('#title').classList.remove('error');
  }

  if (body.trim() === '') {
    isValid = false;
    document.querySelector('#body').classList.add('error');
  } else {
    document.querySelector('#body').classList.remove('error');
  }

  if (isValid) {
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    };
    const responseData = await makeRequest('https://notes-api.dicoding.dev/v2/notes', requestOptions);
    if (responseData && responseData.status === 'success') {
      const noteItem = document.createElement('note-item');
      noteItem.setAttribute('title', title);
      noteItem.setAttribute('body', body);
      noteItem.setAttribute('created-at', responseData.data.createdAt);
      noteItem.setAttribute('note-id', responseData.data.id); // Menambahkan note-id dari respons API
      container.appendChild(noteItem);
      document.querySelector('.form').reset();
    } else {
      console.error('Failed to create note');
    }
  }
});

document.querySelector('#title').addEventListener('input', function () {
  if (this.value.trim() === '') {
    this.classList.add('error');
  } else {
    this.classList.remove('error');
  }
});

document.querySelector('#body').addEventListener('input', function () {
  if (this.value.trim() === '') {
    this.classList.add('error');
  } else {
    this.classList.remove('error');
  }
});

window.addEventListener('DOMContentLoaded', async function () {
  // Tampilkan indikator loading saat halaman dimuat pertama kali
  loadingIndicator.style.display = 'block';

  const requestOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  const responseData = await makeRequest('https://notes-api.dicoding.dev/v2/notes', requestOptions);
  if (responseData && responseData.status === 'success') {
    responseData.data.forEach(function (note) {
      const noteItem = document.createElement('note-item');
      noteItem.setAttribute('title', note.title);
      noteItem.setAttribute('body', note.body);
      noteItem.setAttribute('created-at', note.createdAt);
      noteItem.setAttribute('note-id', note.id); // Menambahkan note-id dari respons API
      container.appendChild(noteItem);
    });
  } else {
    console.error('Failed to fetch notes');
  }

  // Sembunyikan indikator loading setelah data selesai dimuat
  loadingIndicator.style.display = 'none';
});

// Tambahkan indikator loading
const loadingIndicator = document.createElement('div');
loadingIndicator.textContent = 'Loading...';
loadingIndicator.classList.add('loading-indicator');
container.appendChild(loadingIndicator);
