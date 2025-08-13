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
    const gameFinishedInput = document.getElementById('game-finished-input');
    const gamePlatinumInput = document.getElementById('game-platinum-input');

    let games = JSON.parse(localStorage.getItem('games')) || [];
    let gameToRemove = null;
    let isGridView = JSON.parse(localStorage.getItem('isGridView')) || false;

    // Lista de gêneros
    const gameGenres = [
        "Ação", "Ação-Aventura", "Adventure", "Arcade", "Battle Royale",
        "Cartas", "Casual", "Corrida", "Estratégia", "FPS",
        "Hack and Slash", "Indie", "Luta", "MMORPG", "MOBA",
        "Metroidvania", "Musical", "Plataforma", "Puzzle", "RPG",
        "Roguelike", "Roguelite", "RTS", "Simulação", "Soulslike",
        "Esportes", "Stealth", "Survival", "Survival Horror", "Terror",
        "Tiro", "Tower Defense", "Visual Novel", "VR"
    ];

    function renderGames(filter = '') {
        gamesList.innerHTML = '';

        if (isGridView) {
            gamesList.classList.add('grid-view');
            toggleViewBtn.innerHTML = '<i class="fas fa-list"></i>';
        } else {
            gamesList.classList.remove('grid-view');
            toggleViewBtn.innerHTML = '<i class="fas fa-th-large"></i>';
        }

        const filteredGames = games
            .map((game, index) => ({ ...game, originalIndex: index }))
            .filter(game => game.name.toLowerCase().includes(filter.toLowerCase()));

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

            let statusIcons = '';
            if (game.finished) {
                statusIcons += `<span class="status-icon" title="Zerado"><i class="fas fa-check-circle" style="color:#4caf50;"></i></span>`;
            }
            if (game.platinum) {
                statusIcons += `<span class="status-icon" title="Platinado"><i class="fas fa-trophy" style="color:#ffd700;"></i></span>`;
            }

            gameItem.innerHTML = `
                <div class="rank">${game.originalIndex + 1}</div>
                ${imageContent}
                <div class="game-info">
                    <div class="game-name">${game.name} ${statusIcons}</div>
                    <div class="game-extra">
                        ${game.score !== null ? `<span class="game-score">${renderStars(game.score)} |</span>` : ''}
                        ${game.genre ? `<span class="game-genre">Gênero: ${game.genre} |</span>` : ''}
                        ${game.dateCompleted ? `<span class="game-date">Concluído: ${game.dateCompleted.split('-').reverse().join('/')}</span>` : ''}
                    </div>
                </div>
                <div class="game-actions">
                    <button class="action-btn edit-btn" data-id="${game.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn remove-btn" data-id="${game.id}" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="game-popup">
                    <strong>${game.name}</strong><br>
                    ${game.score !== null ? `Nota: ${renderStars(game.score)}<br>` : ''}
                    ${game.genre ? `Gênero: ${game.genre}<br>` : ''}
                    ${game.dateCompleted ? `Concluído em: ${game.dateCompleted.split('-').reverse().join('/')}<br>` : ''}
                    ${game.finished ? 'Zerado<br>' : ''}
                    ${game.platinum ? 'Platinado<br>' : ''}
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
        if (!name.trim()) {
            showFeedback('Digite o nome do jogo!');
            return;
        }

        const newGame = {
            id: Date.now().toString(),
            name: name.trim(),
            imageUrl: imageUrl.trim() || null,
            score: parseInt(document.getElementById('game-score-input').value) || null,
            genre: document.getElementById('game-genre-input').value.trim() || null,
            dateCompleted: document.getElementById('game-date-input').value || null,
            finished: gameFinishedInput.checked,
            platinum: gamePlatinumInput.checked
        };

        games.unshift(newGame);
        saveGames();
        renderGames();
        showFeedback('Jogo adicionado!');
        clearForm();
    }

    function clearForm() {
        gameNameInput.value = '';
        gameImageInput.value = '';
        document.getElementById('game-score-input').value = '0';
        document.getElementById('game-genre-input').value = '';
        document.getElementById('game-genre-search').value = '';
        document.getElementById('game-date-input').value = '';
        gameFinishedInput.checked = false;
        gamePlatinumInput.checked = false;
        resetStars();
        gameNameInput.focus();
    }

    function resetStars() {
        const stars = document.querySelectorAll('.star-rating i');
        stars.forEach(star => {
            star.classList.remove('fas');
            star.classList.add('far');
        });
    }

    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        return stars;
    }

    function removeGame(id) {
        gameToRemove = id;
        confirmModal.style.display = 'flex';
    }

    function setupEditModal(game) {
        document.getElementById('game-name-input').value = game.name;
        document.getElementById('game-image-input').value = game.imageUrl || '';
        document.getElementById('game-genre-input').value = game.genre || '';
        document.getElementById('game-genre-search').value = game.genre || '';
        document.getElementById('game-date-input').value = game.dateCompleted || '';
        gameFinishedInput.checked = game.finished || false;
        gamePlatinumInput.checked = game.platinum || false;

        const stars = document.querySelectorAll('.star-rating i');
        stars.forEach((star, index) => {
            if (index < (game.score || 0)) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
        document.getElementById('game-score-input').value = game.score || '0';

        addBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        addBtn.dataset.editingId = game.id;
        addBtn.classList.add('editing');
        document.getElementById('cancel-edit-btn').style.display = 'block';
    }

    function cancelEdit() {
        clearForm();
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Jogo';
        delete addBtn.dataset.editingId;
        addBtn.classList.remove('editing');
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }

    function saveEditedGame(id) {
        const game = games.find(g => g.id === id);
        if (game) {
            game.name = gameNameInput.value.trim();
            game.imageUrl = gameImageInput.value.trim() || null;
            game.score = parseInt(document.getElementById('game-score-input').value) || null;
            game.genre = document.getElementById('game-genre-input').value.trim() || null;
            game.dateCompleted = document.getElementById('game-date-input').value || null;
            game.finished = gameFinishedInput.checked;
            game.platinum = gamePlatinumInput.checked;

            saveGames();
            renderGames();
            showFeedback('Jogo atualizado!');
            cancelEdit();
        }
    }

    function saveGames() {
        localStorage.setItem('games', JSON.stringify(games));
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
        const draggableElements = [...container.querySelectorAll('.game-item:not(.dragging)')];

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
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                removeGame(id);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const game = games.find(g => g.id === id);
                if (game) {
                    setupEditModal(game);
                    gameNameInput.focus();
                }
            });
        });

        document.querySelectorAll('.game-item').forEach(item => {
            const popup = item.querySelector('.game-popup');
            item.addEventListener('mousemove', function (e) {
                if (popup) {
                    popup.style.opacity = '1';
                    popup.style.pointerEvents = 'auto';
                    popup.style.left = (e.clientX + 15) + 'px';
                    popup.style.top = (e.clientY + 15) + 'px';
                }
            });
            item.addEventListener('mouseleave', function () {
                if (popup) {
                    popup.style.opacity = '0';
                    popup.style.pointerEvents = 'none';
                }
            });
        });

        setupDragAndDrop();
    }

    // Botão de adicionar/salvar
    addBtn.addEventListener('click', function () {
        if (this.classList.contains('editing')) {
            const id = this.dataset.editingId;
            saveEditedGame(id);
        } else {
            addGame(gameNameInput.value, gameImageInput.value);
        }
    });

    // Botão de cancelar edição
    const cancelEditBtn = document.createElement('button');
    cancelEditBtn.id = 'cancel-edit-btn';
    cancelEditBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
    cancelEditBtn.style.display = 'none';
    cancelEditBtn.style.marginTop = '10px';
    cancelEditBtn.style.width = '100%';
    document.querySelector('.add-game').appendChild(cancelEditBtn);

    cancelEditBtn.addEventListener('click', function () {
        cancelEdit();
    });

    // Enter no campo de nome adiciona o jogo
    gameNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });

    // Modal de confirmação
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

    // Busca
    searchInput.addEventListener('input', function () {
        renderGames(this.value);
    });

    // Exportar JSON
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

    // Exportar TXT
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

    // Importar
    importFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedGames = JSON.parse(e.target.result);
                if (Array.isArray(importedGames)) {
                    games = importedGames;
                    saveGames();
                    renderGames();
                    showFeedback('Jogos importados com sucesso!');
                } else {
                    showFeedback('Formato de arquivo inválido!');
                }
            } catch (error) {
                showFeedback('Erro ao importar jogos!');
                console.error(error);
            }
        };
        reader.readAsText(file);
    });

    // Sistema de estrelas
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('click', function () {
            const rating = parseInt(this.getAttribute('data-rating'));
            const stars = document.querySelectorAll('.star-rating i');

            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });

            document.getElementById('game-score-input').value = rating;
        });

        star.addEventListener('mouseover', function () {
            const rating = parseInt(this.getAttribute('data-rating'));
            const stars = document.querySelectorAll('.star-rating i');

            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });

        star.addEventListener('mouseout', function () {
            const currentRating = parseInt(document.getElementById('game-score-input').value);
            const stars = document.querySelectorAll('.star-rating i');

            stars.forEach((s, index) => {
                s.classList.remove('hover');
                if (index < currentRating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
    });

    // Dropdown de gêneros
    function renderGenreDropdown(filter = '') {
        const dropdown = document.getElementById('genre-dropdown');
        dropdown.innerHTML = '';

        const filteredGenres = gameGenres.filter(genre =>
            genre.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredGenres.length === 0) {
            dropdown.innerHTML = '<div class="genre-option">Nenhum gênero encontrado</div>';
            return;
        }

        filteredGenres.forEach(genre => {
            const option = document.createElement('div');
            option.className = 'genre-option';
            option.textContent = genre;
            option.addEventListener('click', function () {
                document.getElementById('game-genre-input').value = genre;
                document.getElementById('game-genre-search').value = genre;
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(option);
        });
    }

    document.getElementById('game-genre-search').addEventListener('focus', function () {
        document.getElementById('genre-dropdown').classList.add('show');
        renderGenreDropdown();
    });

    document.getElementById('game-genre-search').addEventListener('input', function () {
        renderGenreDropdown(this.value);
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.genre-selector')) {
            document.getElementById('genre-dropdown').classList.remove('show');
        }
    });

    // Inicialização
    renderGames();
});