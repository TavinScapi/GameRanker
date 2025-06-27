document.addEventListener('DOMContentLoaded', function () {
    const gamesList = document.getElementById('games-list');
    const gameNameInput = document.getElementById('game-name-input');
    const gameImageInput = document.getElementById('game-image-input');
    const addBtn = document.getElementById('add-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const gamesCount = document.getElementById('games-count');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const importFileInput = document.getElementById('import-file-input');
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const searchInput = document.getElementById('search-input');

    let games = JSON.parse(localStorage.getItem('games')) || [];
    let gameToRemove = null;
    let isGridView = JSON.parse(localStorage.getItem('isGridView')) || false;

    function renderGames(filter = '') {
        gamesList.innerHTML = '';

        // Alterna a classe da lista
        if (isGridView) {
            gamesList.classList.add('grid-view');
            toggleViewBtn.innerHTML = '<i class="fas fa-list"></i>';
        } else {
            gamesList.classList.remove('grid-view');
            toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i>';
        }

        // Filtra os jogos pelo nome
        const filteredGames = games
            .map((game, index) => ({ ...game, originalIndex: index }))
            .filter(game => game.name.toLowerCase().includes(filter.toLowerCase()));

        // Atualiza a contagem de jogos
        gamesCount.textContent = `Jogos na lista: ${filteredGames.length}`;

        if (filteredGames.length === 0) {
            gamesList.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-gamepad"></i>
                    Nenhum jogo encontrado.
                </div>
            `;
            return;
        }

        filteredGames.forEach((game) => {
            const gameItem = document.createElement('li');
            gameItem.className = `game-item ${getRankClass(game.originalIndex)}`;
            gameItem.draggable = true;
            gameItem.dataset.id = game.id;

            const imageContent = game.imageUrl
                ? `<img src="${game.imageUrl}" class="game-image" alt="${game.name}" onerror="this.parentNode.innerHTML='<div class=\'game-image\' style=\'background:var(--steam-gray);display:flex;align-items:center;justify-content:center;\'><i class=\'fas fa-gamepad\'></i></div>'">`
                : `<div class="game-image" style="background:var(--steam-gray);display:flex;align-items:center;justify-content:center;"><i class="fas fa-gamepad"></i></div>`;

            gameItem.innerHTML = `
                <div class="rank">${game.originalIndex + 1}</div>
                ${imageContent}
                <div class="game-info">
                    <div class="game-name">${game.name}</div>
                </div>
                <div class="game-actions">
                    <button class="action-btn edit-btn" data-id="${game.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn remove-btn" data-id="${game.id}" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            gamesList.appendChild(gameItem);
        });

        setupEventListeners();
    }

    function getRankClass(index) {
        if (index === 0) return 'top-1';
        if (index === 1) return 'top-2';
        if (index === 2) return 'top-3';
        return '';
    }

    function showFeedback(msg) {
        const el = document.getElementById('feedback-message');
        el.textContent = msg;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 1800);
    }

    function addGame(name, imageUrl) {
        if (!name.trim()) return;

        const newGame = {
            id: Date.now().toString(),
            name: name.trim(),
            imageUrl: imageUrl.trim() || null,
            pinned: false
        };

        games.unshift(newGame);
        saveGames();
        renderGames();
        showFeedback('Jogo adicionado!');
        gameNameInput.value = '';
        gameImageInput.value = '';
        gameNameInput.focus();
    }

    function removeGame(id) {
        gameToRemove = id;
        confirmModal.style.display = 'flex';
    }

    function editGame(id, newName, newImageUrl) {
        const game = games.find(g => g.id === id);
        if (game && newName.trim()) {
            game.name = newName.trim();
            game.imageUrl = newImageUrl.trim() || null;
            saveGames();
            renderGames();
        }
    }

    function togglePinGame(id) {
        const game = games.find(g => g.id === id);
        if (game) {
            game.pinned = !game.pinned;
            saveGames();
            renderGames();
        }
    }

    function saveGames() {
        // Não precisa mais ordenar por pinned
        localStorage.setItem('games', JSON.stringify(games));
    }

    function autoScrollDuringDrag(e) {
        const padding = 100; // margem superior/inferior para ativar scroll
        const scrollSpeed = 10;

        const y = e.clientY;
        const windowHeight = window.innerHeight;

        if (y < padding) {
            // scroll para cima
            window.scrollBy(0, -scrollSpeed);
        } else if (y > windowHeight - padding) {
            // scroll para baixo
            window.scrollBy(0, scrollSpeed);
        }
    }


    function setupDragAndDrop() {
        const items = document.querySelectorAll('.game-item');

        items.forEach(item => {
            item.addEventListener('dragstart', function () {
                this.classList.add('dragging');
            });

            item.addEventListener('dragend', function () {
                this.classList.remove('dragging');
            });
        });

        gamesList.addEventListener('dragover', function (e) {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;

            const afterElement = getDragAfterElement(this, e.clientY);

            if (afterElement == null) {
                this.appendChild(draggingItem);
            } else {
                this.insertBefore(draggingItem, afterElement);
            }
        });

        gamesList.addEventListener('dragover', function (e) {
            e.preventDefault();
            autoScrollDuringDrag(e); // ← aqui!

            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;

            const afterElement = getDragAfterElement(this, e.clientY);

            if (afterElement == null) {
                this.appendChild(draggingItem);
            } else {
                this.insertBefore(draggingItem, afterElement);
            }
        });



        gamesList.addEventListener('drop', function (e) {
            e.preventDefault();
            const draggingItem = document.querySelector('.dragging');
            if (!draggingItem) return;

            const newIndex = Array.from(this.children).indexOf(draggingItem);
            const gameId = draggingItem.dataset.id;

            const gameIndex = games.findIndex(g => g.id === gameId);
            if (gameIndex === -1) return;

            const [movedGame] = games.splice(gameIndex, 1);
            games.splice(newIndex, 0, movedGame);
            saveGames();
            renderGames();
        });
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.game-item:not(.dragging):not(.pinned)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function setupEventListeners() {
        // Remover o listener do botão de fixar
        // document.querySelectorAll('.pin-btn').forEach(btn => { ... });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const gameItem = this.closest('.game-item');
                const game = games.find(g => g.id === id);

                gameItem.innerHTML = `
                    <div class="rank">${gameItem.querySelector('.rank').textContent}</div>
                    ${game.imageUrl
                        ? `<img src="${game.imageUrl}" class="game-image" alt="${game.name}">`
                        : '<div class="game-image" style="background:var(--steam-gray);display:flex;align-items:center;justify-content:center;"><i class="fas fa-gamepad"></i></div>'}
                    <div class="edit-form">
                        <input type="text" class="edit-input" value="${game.name}" placeholder="Nome do jogo" autofocus>
                        <input type="text" class="edit-input" value="${game.imageUrl || ''}" placeholder="URL da imagem (opcional)">
                        <div class="edit-buttons">
                            <button type="button" class="save-btn">Salvar</button>
                            <button type="button" class="cancel-btn">Cancelar</button>
                        </div>
                    </div>
                `;

                const nameInput = gameItem.querySelectorAll('.edit-input')[0];
                const imageInput = gameItem.querySelectorAll('.edit-input')[1];
                const saveBtn = gameItem.querySelector('.save-btn');
                const cancelBtn = gameItem.querySelector('.cancel-btn');

                saveBtn.addEventListener('click', function () {
                    editGame(id, nameInput.value, imageInput.value);
                });

                cancelBtn.addEventListener('click', function () {
                    renderGames();
                });

                nameInput.addEventListener('keyup', function (e) {
                    if (e.key === 'Enter') {
                        editGame(id, nameInput.value, imageInput.value);
                    } else if (e.key === 'Escape') {
                        renderGames();
                    }
                });
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                removeGame(id);
            });
        });

        setupDragAndDrop();
    }

    addBtn.addEventListener('click', function () {
        addGame(gameNameInput.value, gameImageInput.value);
    });

    gameNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addGame(this.value, gameImageInput.value);
        }
    });

    modalConfirmBtn.addEventListener('click', function () {
        if (gameToRemove) {
            const li = document.querySelector(`.game-item[data-id="${gameToRemove}"]`);
            if (li) {
                li.classList.add('removing');
                setTimeout(() => {
                    games = games.filter(game => game.id !== gameToRemove);
                    saveGames();
                    renderGames();
                    showFeedback('Jogo removido!');
                    gameToRemove = null;
                }, 300);
            } else {
                games = games.filter(game => game.id !== gameToRemove);
                saveGames();
                renderGames();
                showFeedback('Jogo removido!');
                gameToRemove = null;
            }
        }
        confirmModal.style.display = 'none';
    });

    modalCancelBtn.addEventListener('click', function () {
        confirmModal.style.display = 'none';
    });

    confirmModal.addEventListener('click', function (e) {
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });

    // Alternar visualização
    toggleViewBtn.addEventListener('click', function () {
        isGridView = !isGridView;
        localStorage.setItem('isGridView', JSON.stringify(isGridView));
        renderGames();
    });

    // Atualize o listener do campo de busca:
    searchInput.addEventListener('input', function () {
        renderGames(this.value);
    });

    // Função para exportar como JSON
    exportJsonBtn.addEventListener('click', function () {
        const dataStr = JSON.stringify(games, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'gameranker.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Função para exportar como TXT
    exportTxtBtn.addEventListener('click', function () {
        let txt = '';
        games.forEach((game, idx) => {
            txt += `${idx + 1}. ${game.name}\n`;
        });
        const blob = new Blob([txt], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'gameranker.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    renderGames();
});