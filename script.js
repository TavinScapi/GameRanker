document.addEventListener('DOMContentLoaded', function () {
    const gamesList = document.getElementById('games-list');
    const gameNameInput = document.getElementById('game-name-input');
    const gameImageInput = document.getElementById('game-image-input');
    const addBtn = document.getElementById('add-btn');
    const confirmModal = document.getElementById('confirm-modal');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    let games = JSON.parse(localStorage.getItem('games')) || [];
    let gameToRemove = null;

    function renderGames() {
        gamesList.innerHTML = '';

        if (games.length === 0) {
            gamesList.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-gamepad"></i>
                    Sua lista de jogos está vazia.<br>
                    Adicione seus jogos favoritos para começar!
                </div>
            `;
            return;
        }

        games.forEach((game, index) => {
            const gameItem = document.createElement('li');
            gameItem.className = `game-item ${getRankClass(index)}`;
            gameItem.draggable = true;
            gameItem.dataset.id = game.id;

            if (game.pinned) {
                gameItem.classList.add('pinned');
            }

            const imageContent = game.imageUrl
                ? `<img src="${game.imageUrl}" class="game-image" alt="${game.name}" onerror="this.parentNode.innerHTML='<div class=\'game-image\' style=\'background:var(--steam-gray);display:flex;align-items:center;justify-content:center;\'><i class=\'fas fa-gamepad\'></i></div>'">`
                : `<div class="game-image" style="background:var(--steam-gray);display:flex;align-items:center;justify-content:center;"><i class="fas fa-gamepad"></i></div>`;

            gameItem.innerHTML = `
                <div class="rank">${index + 1}</div>
                ${imageContent}
                <div class="game-info">
                    <div class="game-name">${game.name} ${game.pinned ? '<span class="pinned-label">FIXO</span>' : ''}</div>
                </div>
                <div class="game-actions">
                    <button class="action-btn pin-btn" data-id="${game.id}" title="${game.pinned ? 'Desfixar' : 'Fixar'}">
                        <i class="fas ${game.pinned ? 'fa-lock' : 'fa-thumbtack'}"></i>
                    </button>
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
        games.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
        localStorage.setItem('games', JSON.stringify(games));
    }

    function setupDragAndDrop() {
        const items = document.querySelectorAll('.game-item:not(.pinned)');

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
            const pinnedItems = Array.from(this.querySelectorAll('.pinned'));
            const lastPinnedItem = pinnedItems[pinnedItems.length - 1];

            if (lastPinnedItem && (!afterElement ||
                this.compareDocumentPosition(afterElement) & Node.DOCUMENT_POSITION_FOLLOWING &&
                lastPinnedItem.compareDocumentPosition(afterElement) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                this.insertBefore(draggingItem, lastPinnedItem.nextSibling);
            } else if (afterElement == null) {
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
            const pinnedCount = games.filter(g => g.pinned).length;
            const adjustedIndex = Math.max(newIndex, pinnedCount);

            games.splice(adjustedIndex, 0, movedGame);
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
        document.querySelectorAll('.pin-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                togglePinGame(id);
            });
        });

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
            games = games.filter(game => game.id !== gameToRemove);
            saveGames();
            renderGames();
            gameToRemove = null;
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

    renderGames();
});