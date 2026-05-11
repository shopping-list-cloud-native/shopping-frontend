        function filterListsForDashboard(lists) {
            const search = getDashboardSearchTerm();
            if (!search) {
                return lists;
            }

            return lists.filter((list) => (list.name || '').toLowerCase().includes(search));
        }

        function buildListCard(list, type) {
            const itemsCount = Array.isArray(list.items) ? list.items.length : 0;
            const maxBudget = toNumber(list.max_budget);
            const estimatedTotal = Array.isArray(list.items)
                ? list.items.reduce((sum, item) => sum + (toNumber(item.estimated_price) * toNumber(item.quantity || 1)), 0)
                : 0;
            const progress = maxBudget > 0 ? Math.min((estimatedTotal / maxBudget) * 100, 100) : 0;
            const progressLabel = maxBudget > 0
                ? `${Math.round(progress)}% din buget consumat`
                : 'Fără limită de buget setată';
            const productsLabel = `${itemsCount} ${itemsCount === 1 ? 'produs' : 'produse'}`;
            const badgeClass = type === 'owner' ? 'badge-owner' : 'badge-shared';
            const badgeText = type === 'owner' ? 'Owner' : 'Editor';
            const budgetStateClass = estimatedTotal > maxBudget && maxBudget > 0 ? 'over-budget' : '';
            const metaLine = type === 'owner'
                ? `${productsLabel} • ${list.created_at ? `Actualizat ${new Date(list.created_at).toLocaleDateString('ro-RO')}` : 'Actualizat recent'}`
                : `${productsLabel} • Partajată în sesiunea curentă`;
            const peopleMarkup = type === 'shared'
                ? `
                    <div class="avatar-stack">
                        <span class="avatar-chip">MP</span>
                        <span class="avatar-chip">AP</span>
                    </div>
                `
                : '<span style="opacity:0.7">⋮</span>';

            return `
                <article class="list-dashboard-card">
                    <div class="list-dashboard-card-header">
                        <div>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                            <h4>${list.name || 'Listă fără nume'}</h4>
                            <div class="list-dashboard-meta">
                                ${metaLine}
                            </div>
                        </div>
                        ${peopleMarkup}
                    </div>
                    <div>
                        <span class="budget-caption">Buget</span>
                        <div class="budget-row">
                            <span class="dashboard-subtle"></span>
                            <strong class="${budgetStateClass}">${formatCurrency(estimatedTotal)} / ${formatCurrency(maxBudget)}</strong>
                        </div>
                        <div class="budget-track">
                            <span class="${budgetStateClass}" style="width:${progress}%"></span>
                        </div>
                    </div>
                    <div class="budget-row">
                        <span class="dashboard-subtle budget-percentage">${progressLabel}</span>
                        <button type="button" class="view-all-button" onclick="openListFromDashboard('${list.id}')">Deschide</button>
                    </div>
                </article>
            `;
        }

        function renderListCollection(elementId, lists, type, emptyMessage) {
            const container = document.getElementById(elementId);
            const filteredLists = filterListsForDashboard(lists);

            if (!Array.isArray(filteredLists) || filteredLists.length === 0) {
                container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
                return;
            }

            container.innerHTML = filteredLists.map((list) => buildListCard(list, type)).join('');
        }

        function renderRecentActivity(notifications, ownedLists, sharedLists) {
            const container = document.getElementById('recent-activity');
            const cards = [];

            if (Array.isArray(notifications) && notifications.length > 0) {
                for (const notification of notifications.slice(0, 4)) {
                    cards.push(`
                        <article class="notification-card">
                            <div class="notification-icon primary">🛒</div>
                            <div class="notification-body">
                                <strong>Actualizare listă</strong>
                                <span>${notification.message || 'Mesaj indisponibil'}</span>
                            </div>
                        </article>
                    `);
                }
            }

            const overBudgetLists = [...ownedLists, ...sharedLists].filter((list) => {
                const budget = toNumber(list.max_budget);
                const estimated = Array.isArray(list.items)
                    ? list.items.reduce((sum, item) => sum + (toNumber(item.estimated_price) * toNumber(item.quantity || 1)), 0)
                    : 0;
                return budget > 0 && estimated > budget;
            });

            for (const list of overBudgetLists.slice(0, 2)) {
                cards.push(`
                    <article class="notification-card">
                        <div class="notification-icon error">!</div>
                        <div class="notification-body">
                            <strong>Buget depășit!</strong>
                            <span>Lista "${list.name}" a depășit bugetul setat și are nevoie de ajustări.</span>
                        </div>
                    </article>
                `);
            }

            if (cards.length === 0) {
                container.innerHTML = '<div class="empty-state">Nu există activitate suficientă încă. Creează sau partajează o listă pentru a popula dashboard-ul.</div>';
                return;
            }

            container.innerHTML = cards.join('');
        }

        function renderNotificationsFeed(notifications, lists) {
            const container = document.getElementById('notifications-feed');
            const cards = [];
            const formatted = formatAccessibleLists(lists);
            const allLists = [...formatted.created_by_me, ...formatted.shared_with_me];

            if (Array.isArray(notifications) && notifications.length > 0) {
                for (const notification of notifications.slice(0, 4)) {
                    cards.push(`
                        <article class="notification-feed-card" data-notification-id="${notification.id}" style="cursor: pointer;">
                            <div class="notification-feed-icon primary">👥</div>
                            <div class="notification-feed-body">
                                <div class="notification-feed-top">
                                    <strong>Actualizare colaborare</strong>
                                    <span class="notification-time">RECENT</span>
                                </div>
                                <p>${notification.message || 'Mesaj indisponibil'}</p>
                            </div>
                        </article>
                    `);
                }
            }

            for (const list of allLists.slice(0, 3)) {
                const budget = toNumber(list.max_budget);
                const estimated = Array.isArray(list.items)
                    ? list.items.reduce((sum, item) => sum + (toNumber(item.estimated_price) * toNumber(item.quantity || 1)), 0)
                    : 0;

                if (budget > 0 && estimated > budget) {
                    const progress = Math.round((estimated / budget) * 100);
                    cards.push(`
                        <article class="notification-feed-card error">
                            <div class="notification-feed-icon error">!</div>
                            <div class="notification-feed-body">
                                <div class="notification-feed-top">
                                    <strong>Alertă Buget Depășit</strong>
                                    <span class="notification-time">ALERTĂ</span>
                                </div>
                                <p>Lista <strong>"${list.name}"</strong> a depășit bugetul setat cu <strong>${formatCurrency(estimated - budget)}</strong>.</p>
                                <div class="notification-progress">
                                    <div class="notification-progress-meta">
                                        <span>PROGRES BUGET</span>
                                        <span class="error">${progress}%</span>
                                    </div>
                                    <div class="budget-track">
                                        <span class="over-budget" style="width:100%"></span>
                                    </div>
                                </div>
                            </div>
                        </article>
                    `);
                }
            }

            if (cards.length === 0) {
                container.innerHTML = '<div class="empty-state">Nu mai sunt alte notificări de afișat.</div>';
                return;
            }

            container.innerHTML = cards.join('');

            // Adaug delegated event listener pentru notificări
            container.addEventListener('click', async (e) => {
                const card = e.target.closest('[data-notification-id]');
                if (card) {
                    await markNotificationAsRead(card.dataset.notificationId);
                }
            });
        }

        function renderDashboard(lists, notifications = []) {
            const formatted = formatAccessibleLists(lists);
            const ownedLists = formatted.created_by_me;
            const sharedLists = formatted.shared_with_me;

            renderListCollection(
                'owned-lists-cards',
                ownedLists,
                'owner',
                'Nu ai încă liste create. Poți genera prima listă din Control Center.'
            );
            renderListCollection(
                'shared-lists-cards',
                sharedLists,
                'shared',
                'Nu există încă liste partajate cu acest utilizator.'
            );
            renderRecentActivity(notifications, ownedLists, sharedLists);
        }

        async function markNotificationAsRead(notificationId) {
            try {
                await makeRequest('PATCH', `/notifications/${notificationId}`, null, token);
                // Reîncarcă notificările după marcare
                await getNotifications();
            } catch (error) {
                console.error('Eroare la marcare notificare:', error);
            }
        }

        async function attachItemsToLists(lists) {
            if (!Array.isArray(lists) || lists.length === 0) {
                return [];
            }

            return Promise.all(lists.map(async (list) => {
                try {
                    const items = await makeRequest('GET', `/lists/${list.id}/items`, null, token);
                    return {
                        ...list,
                        items: Array.isArray(items) ? items : [],
                    };
                } catch {
                    return {
                        ...list,
                        items: [],
                    };
                }
            }));
        }

        async function refreshDashboard() {
            if (!token) {
                return;
            }

            updateStatus('Reîmprospătare dashboard...');

            try {
                const lists = await makeRequest('GET', '/lists/accessible', null, token);
                currentLists = await attachItemsToLists(Array.isArray(lists) ? lists : []);
                populateListSelect(currentLists);

                let notifications = [];
                try {
                    const loadedNotifications = await makeRequest('GET', '/notifications', null, token);
                    notifications = Array.isArray(loadedNotifications) ? loadedNotifications : [];
                } catch {
                    notifications = [];
                }

                currentNotifications = notifications;
                renderDashboard(currentLists, currentNotifications);
                renderNotificationsFeed(currentNotifications, currentLists);
                if (activeWorkspaceSection === 'my-lists') {
                    await renderMyListsSection(myListId);
                } else if (activeWorkspaceSection === 'shared') {
                    await renderSharedSection();
                }
                updateStatus('Dashboard actualizat');
            } catch (error) {
                if (isAuthError(error)) {
                    endUserSession('Sesiunea a expirat. Autentifică-te din nou.');
                    throw error;
                }

                updateStatus('Eroare la actualizare dashboard');
                renderRecentActivity([], [], []);
                showResponse('additional-response', error.message, false);
            }
        }

        function openListFromDashboard(selectedListId) {
            listId = selectedListId;
            const select = document.getElementById('list-select');
            if (select) {
                select.value = selectedListId;
            }
            openMyLists(selectedListId);
        }
