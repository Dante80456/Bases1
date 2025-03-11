document.getElementById('addBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const year = document.getElementById('year').value;

    const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author, year }),
    });

    if (response.status === 409) { // ⚠️ Código 409 indica libro duplicado
        const data = await response.json();
        alert(`⚠️ ${data.message}`); // Muestra la alerta con el mensaje del backend
        return;
    }
    
    if (response.ok) {
        alert('✅ Libro agregado exitosamente');
        loadBooks();
    } else {
        alert('❌ Error al agregar el libro duplicado');
    }
    
});

document.getElementById('updateBookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('bookId').value;
    const title = document.getElementById('updateTitle').value;
    const author = document.getElementById('updateAuthor').value;
    const year = document.getElementById('updateYear').value;

    const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author, year }),
    });

    if (response.ok) {
        alert('Libro actualizado exitosamente');
        loadBooks();
    } else {
        alert('Error al actualizar el libro');
    }
});

async function loadBooks() {
    const response = await fetch('/api/books');
    const books = await response.json();
    const dataContainer = document.getElementById('dataContainer');
    dataContainer.innerHTML = '';

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.textContent = `ID: ${book.id}, Título: ${book.title}, Autor: ${book.author}, Año: ${book.year}`;
        
        // Crear botón de eliminar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.addEventListener('click', async () => {
            const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este libro?');
            if (confirmDelete) {
                const deleteResponse = await fetch(`/api/books/${book.id}`, {
                    method: 'DELETE',
                });
                if (deleteResponse.ok) {
                    alert('Libro eliminado exitosamente');
                    loadBooks(); // Recargar la lista de libros
                } else {
                    alert('Error al eliminar el libro');
                }
            }
        });

        // Agregar el botón de eliminar al elemento del libro
        bookElement.appendChild(deleteButton);
        dataContainer.appendChild(bookElement);
    });
}

document.getElementById('generatePDF').addEventListener('click', async () => {
    const response = await fetch('/api/books');
    const books = await response.json();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text('Lista de Libros', 10, 10);
    let y = 20;

    books.forEach(book => {
        doc.text(`ID: ${book.id}, Título: ${book.title}, Autor: ${book.author}, Año: ${book.year}`, 10, y);
        y += 10;
    });

    doc.save('libros.pdf');
});

// Cargar los libros al inicio
loadBooks();