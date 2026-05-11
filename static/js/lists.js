        function populateMyListPicker(lists) {
            const picker = document.getElementById('my-list-picker');
            picker.innerHTML = '';

            const ownedLists = formatAccessibleLists(lists).created_by_me;
            if (!ownedLists.length) {
                picker.classList.add('hidden');
                return;
            }

            for (const list of ownedLists) {
                const option = document.createElement('option');
                option.value = list.id;
                option.textContent = list.name;
                picker.appendChild(option);
            }

            if (!myListId || !ownedLists.some((list) => list.id === myListId)) {
                myListId = ownedLists[0].id;
            }

            picker.value = myListId;
            picker.classList.remove('hidden');
        }

        function calculateBudgetStatus(currentTotal, maxBudget) {
            if (maxBudget <= 0) {
                return currentTotal > 0 ? 'over_budget' : 'within_budget';
            }
            if (currentTotal > maxBudget) {
                return 'over_budget';
            }
            if (currentTotal >= maxBudget * 0.8) {
                return 'near_limit';
            }
            return 'within_budget';
        }

        function getBudgetStatusLabel(status) {
            const labels = {
                'within_budget': 'În limită',
                'near_limit': 'Aproape de limită',
                'over_budget': 'Depășit'
            };
            return labels[status] || status;
        }

        function buildMyListItem(item, index, completed = false) {
            const quantity = toNumber(item.quantity) || 1;
            const estimatedPrice = toNumber(item.estimated_price);
            const dragging = !completed && index === 2;
            const quantityLabel = `${quantity} buc.`;
            const nextCheckedState = !Boolean(item.checked);
            const isEditing = editingMyListItemId === item.id;
            const nameMarkup = isEditing
                ? `
                    <input
                        id="edit-item-name-${item.id}"
                        type="text"
                        class="my-list-item-inline-input"
                        value="${escapeAttribute(item.name || '')}"
                        onkeydown="handleMyListItemEditKeydown(event, '${item.id}')"
                    >
                    <div class="my-list-item-meta-line">
                        <span>${quantityLabel}</span>
                    </div>
                `
                : `
                    <strong class="${completed ? 'completed' : ''}">${item.name || 'Articol fără nume'}</strong>
                    <div class="my-list-item-meta-line">
                        <span>${quantityLabel}</span>
                    </div>
                `;
            const priceMarkup = isEditing
                ? `
                    <input
                        id="edit-item-quantity-${item.id}"
                        type="number"
                        min="1"
                        step="1"
                        class="my-list-item-inline-quantity"
                        value="${escapeAttribute(quantity)}"
                        onkeydown="handleMyListItemEditKeydown(event, '${item.id}')"
                    >
                    <input
                        id="edit-item-price-${item.id}"
                        type="number"
                        step="0.01"
                        min="0"
                        class="my-list-item-inline-price"
                        value="${escapeAttribute(estimatedPrice)}"
                        onkeydown="handleMyListItemEditKeydown(event, '${item.id}')"
                    >
                    <span>${quantityLabel}</span>
                `
                : `
                    <strong class="${completed ? 'completed' : ''}">${formatCurrency(estimatedPrice)}</strong>
                    <span>${quantityLabel}</span>
                `;
            const editButtonMarkup = isEditing
                ? `<button type="button" class="my-list-item-edit save" onclick="saveMyListItemEdit('${item.id}')">Save</button>`
                : `<button type="button" class="my-list-item-edit" onclick="startMyListItemEdit('${item.id}')">✎</button>`;

            return `
                <article class="my-list-item ${completed ? 'completed' : ''} ${dragging ? 'dragging' : ''}">
                    <span class="drag-dot">${completed ? '' : '⋮'}</span>
                    <button
                        type="button"
                        class="check-visual ${completed ? 'checked' : ''}"
                        onclick="toggleMyListItemChecked('${item.id}', ${nextCheckedState})"
                        aria-label="${completed ? 'Debifează produsul' : 'Bifează produsul'}"
                    ></button>
                    <div class="my-list-item-body">
                        ${nameMarkup}
                    </div>
                    <div class="my-list-item-price">
                        ${priceMarkup}
                    </div>
                    ${editButtonMarkup}
                    <button type="button" class="my-list-item-delete" onclick="deleteItemFromMyList('${item.id}')">🗑</button>
                </article>
            `;
        }

        function buildItemsBlock(title, items, completed = false) {
            if (!items.length) {
                return '';
            }

            return `
                <section class="my-list-category">
                    <h4 class="my-list-category-title">${title}</h4>
                    <div class="my-list-items">
                        ${items.map((item, index) => buildMyListItem(item, index, completed)).join('')}
                    </div>
                </section>
            `;
        }

        function buildMyListQuickAddInlineForm() {
            if (!showingMyListQuickAddForm) {
                return '';
            }

            return `
                <form class="my-list-item quick-add-inline" onsubmit="submitMyListQuickAdd(event)">
                    <span class="drag-dot"></span>
                    <span class="check-visual placeholder"></span>
                    <div class="my-list-item-body">
                        <input
                            id="quick-add-item-name"
                            type="text"
                            class="my-list-item-inline-input"
                            placeholder="Nume produs"
                            required
                        >
                        <div class="my-list-item-meta-line">
                            <input
                                id="quick-add-item-quantity"
                                type="number"
                                min="1"
                                step="1"
                                class="my-list-item-inline-quantity"
                                placeholder="Cantitate"
                                value="1"
                                required
                            >
                        </div>
                    </div>
                    <div class="my-list-item-price">
                        <input
                            id="quick-add-item-price"
                            type="number"
                            min="0"
                            step="0.01"
                            class="my-list-item-inline-price"
                            placeholder="Preț estimat"
                            required
                        >
                    </div>
                    <button type="submit" class="my-list-item-edit save">Save</button>
                    <button type="button" class="my-list-item-delete cancel" onclick="hideMyListQuickAddForm()">×</button>
                </form>
            `;
        }

        function escapeAttribute(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function renderMyListContent(list, items, members = []) {
            const container = document.getElementById('my-list-content');

            if (!list) {
                container.innerHTML = '<div class="empty-state">Nu există nicio listă proprie disponibilă.</div>';
                return;
            }

            const otherMembersCount = members.filter(m => m.role !== 'owner').length;
            const membersDisplayText = otherMembersCount > 0 ? `<span class="avatar-chip">+${otherMembersCount}</span>` : '';
            
            const totalEstimate = items.reduce((sum, item) => sum + (toNumber(item.estimated_price) * (toNumber(item.quantity) || 1)), 0);
            const maxBudget = toNumber(list.max_budget);
            const progress = maxBudget > 0 ? Math.min((totalEstimate / maxBudget) * 100, 100) : 0;
            const remaining = maxBudget - totalEstimate;
            const budgetStatus = calculateBudgetStatus(totalEstimate, maxBudget);
            const budgetStatusLabel = getBudgetStatusLabel(budgetStatus);
            const uncheckedItems = items.filter((item) => !item.checked);
            const checkedItems = items.filter((item) => item.checked);
            const titleMarkup = editingMyListDetails
                ? `
                    <input
                        id="my-list-name-input"
                        type="text"
                        class="my-list-title-input"
                        value="${escapeAttribute(list.name || '')}"
                        placeholder="Nume listă"
                        onkeydown="handleMyListInlineKeydown(event)"
                    >
                `
                : `<h3>${list.name || 'Listă fără nume'}</h3>`;
            const budgetMarkup = editingMyListDetails
                ? `
                    <input
                        id="my-list-budget-input"
                        type="number"
                        class="my-list-budget-input"
                        step="0.01"
                        min="0"
                        value="${escapeAttribute(maxBudget)}"
                        placeholder="Limită buget"
                        onkeydown="handleMyListInlineKeydown(event)"
                    >
                `
                : `<strong>${formatCurrency(maxBudget)}</strong>`;
            const editButtonMarkup = editingMyListDetails
                ? `<button type="submit" class="icon-action icon-action-save">Save</button>`
                : `<button type="button" class="icon-action" onclick="focusMyListEditForm()">✎</button>`;
            const deleteButtonMarkup = list.owner_id === currentUserId
                ? `<button type="button" class="icon-action icon-action-danger" onclick="deleteMyCurrentList()">🗑</button>`
                : '';
            const uncheckedItemsBlock = buildItemsBlock('Articole de cumpărat', uncheckedItems);
            const checkedItemsBlock = buildItemsBlock('Finalizate', checkedItems, true);
            container.innerHTML = `
                <form class="my-list-card" onsubmit="submitMyListEdit(event)">
                    <div class="my-list-header">
                        <div>
                            <div class="list-people">
                                ${titleMarkup}
                                <span class="badge badge-shared">Owner</span>
                            </div>
                            <div class="my-list-meta">
                                <span>📅</span>
                                <span>${list.created_at ? `Actualizat ${new Date(list.created_at).toLocaleDateString('ro-RO')}` : 'Actualizat recent'}</span>
                                <span class="bullet">•</span>
                                <span>${items.length} articole</span>
                            </div>
                        </div>
                        <div class="my-list-actions">
                            <button type="button" class="icon-action" onclick="openControlCenterForList('${list.id}')">↗</button>
                            ${editButtonMarkup}
                            ${deleteButtonMarkup}
                        </div>
                    </div>

                    <div class="budget-hero-grid">
                        <div class="budget-hero-head">
                            <div class="budget-hero-group ${remaining < 0 ? 'over' : 'primary'}">
                                <span class="budget-caption">Estimat</span>
                                <strong>${formatCurrency(totalEstimate)}</strong>
                            </div>
                            <div class="budget-hero-group">
                                <span class="budget-caption">Limită buget</span>
                                ${budgetMarkup}
                            </div>
                        </div>
                        <div class="budget-hero-progress">
                            <span class="budget-progress-bar ${budgetStatus}" style="width:${progress}%"></span>
                        </div>
                        <div class="budget-hero-foot">
                            <span>${maxBudget > 0 ? `${Math.round(progress)}% din buget consumat - ${budgetStatusLabel}` : 'Fără limită setată'}</span>
                            <span class="${remaining < 0 ? 'negative' : 'positive'}">${remaining < 0 ? `${formatCurrency(Math.abs(remaining))} peste limită` : `${formatCurrency(remaining)} rămași`}</span>
                        </div>
                    </div>
                </form>

                ${uncheckedItemsBlock}
                ${buildMyListQuickAddInlineForm()}
                ${checkedItemsBlock}

                <div class="collab-grid">
                    <div class="collab-card primary">
                        <div class="avatar-stack">
                            <span class="avatar-chip">TU</span>
                            ${membersDisplayText}
                        </div>
                        <div class="collab-copy">
                            <strong>Utilizatori activi</strong>
                            <button type="button" onclick="openMembersModal('${list.id}')">Gestionează accesul</button>
                        </div>
                    </div>
                    <div class="collab-card secondary quick-add-card">
                        <div class="quick-add-copy">
                            <strong>Adaugă produs nou</strong>
                            <span>Deschide formularul direct sub produsele existente.</span>
                        </div>
                        <button type="button" class="quick-add-button" onclick="focusMyListQuickAddForm()">Adaugă produs</button>
                    </div>
                </div>
            `;
        }

        function getInitialsFromEmail(email) {
            const displayName = formatDisplayName(email);
            const initials = displayName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0].toUpperCase())
                .join('');
            return initials || 'BW';
        }

        function getSharedBudgetState(estimatedTotal, maxBudget) {
            if (maxBudget <= 0) {
                return {
                    progress: 0,
                    progressLabel: 'Fără limită',
                    trackClass: '',
                    valueClass: 'ok',
                };
            }

            const ratio = estimatedTotal / maxBudget;
            if (ratio > 1) {
                return {
                    progress: 100,
                    progressLabel: 'over',
                    trackClass: 'over',
                    valueClass: 'over',
                };
            }

            if (ratio >= 0.8) {
                return {
                    progress: Math.round(ratio * 100),
                    progressLabel: 'warn',
                    trackClass: 'warn',
                    valueClass: 'warn',
                };
            }

            return {
                progress: Math.round(ratio * 100),
                progressLabel: 'ok',
                trackClass: '',
                valueClass: 'ok',
            };
        }

        async function buildSharedDetail(list) {
            const [items, members] = await Promise.all([
                makeRequest('GET', `/lists/${list.id}/items`, null, token),
                makeRequest('GET', `/lists/${list.id}/members`, null, token),
            ]);

            const safeItems = Array.isArray(items) ? items : [];
            const safeMembers = Array.isArray(members) ? members : [];
            const owner = safeMembers.find((member) => member.role === 'owner');
            const currentMember = safeMembers.find((member) => member.user_id === currentUserId);
            const role = currentMember?.role || 'viewer';
            const estimatedTotal = safeItems.reduce(
                (sum, item) => sum + (toNumber(item.estimated_price) * (toNumber(item.quantity) || 1)),
                0
            );
            const maxBudget = toNumber(list.max_budget);
            const budgetState = getSharedBudgetState(estimatedTotal, maxBudget);

            return {
                list,
                items: safeItems,
                owner,
                role,
                estimatedTotal,
                maxBudget,
                budgetState,
            };
        }

        function buildSharedDetailCard(detail) {
            const roleLabel = detail.role === 'viewer' ? 'VIEWER' : 'EDITOR';
            const ownerName = detail.owner?.email ? formatDisplayName(detail.owner.email) : 'Proprietar indisponibil';
            const ownerInitials = detail.owner?.email ? getInitialsFromEmail(detail.owner.email) : 'BW';
            const productCountLabel = `${detail.items.length} produse`;
            const budgetValueClass = detail.budgetState.valueClass;
            const budgetTrackClass = detail.budgetState.trackClass;

            return `
                <article class="shared-detail-card">
                    <div class="shared-detail-top">
                        <span class="shared-detail-role ${detail.role === 'viewer' ? 'viewer' : 'editor'}">${roleLabel}</span>
                        <span class="shared-item-count"><span class="icon">🛒</span>${productCountLabel}</span>
                    </div>
                    <div>
                        <h3>${detail.list.name || 'Listă fără nume'}</h3>
                        <div class="shared-owner-row">
                            <span class="shared-owner-avatar">${ownerInitials}</span>
                            <span>Proprietar: <strong>${ownerName}</strong></span>
                        </div>
                    </div>
                    <div class="shared-budget-block">
                        <div class="shared-budget-meta">
                            <strong>Buget consumat</strong>
                            <span class="${budgetValueClass}">${formatCurrency(detail.estimatedTotal)} / ${formatCurrency(detail.maxBudget)}</span>
                        </div>
                        <div class="shared-budget-track">
                            <span class="${budgetTrackClass}" style="width:${detail.budgetState.progress}%"></span>
                        </div>
                    </div>
                </article>
            `;
        }

        async function renderSharedSection() {
            const container = document.getElementById('shared-page-grid');
            const sharedLists = formatAccessibleLists(currentLists).shared_with_me;

            if (!sharedLists.length) {
                container.innerHTML = '<div class="shared-empty">Nu există încă liste partajate cu utilizatorul curent.</div>';
                return;
            }

            container.innerHTML = '<div class="shared-empty">Se încarcă listele partajate...</div>';

            try {
                const details = await Promise.all(sharedLists.map((list) => buildSharedDetail(list)));
                container.innerHTML = details.map((detail) => buildSharedDetailCard(detail)).join('');
            } catch (error) {
                container.innerHTML = `<div class="shared-empty">${error.message}</div>`;
            }
        }

        async function renderMyListsSection(forceListId = null) {
            const ownedLists = formatAccessibleLists(currentLists).created_by_me;
            if (!ownedLists.length) {
                document.getElementById('my-list-content').innerHTML = '<div class="empty-state">Nu ai încă liste create. Creează una nouă pentru a popula această pagină.</div>';
                document.getElementById('my-list-picker').classList.add('hidden');
                return;
            }

            if (forceListId) {
                myListId = forceListId;
            }

            populateMyListPicker(currentLists);

            const selectedList = ownedLists.find((list) => list.id === myListId) || ownedLists[0];
            myListId = selectedList.id;
            listId = selectedList.id;

            try {
                const items = await makeRequest('GET', `/lists/${myListId}/items`, null, token);
                const members = await makeRequest('GET', `/lists/${myListId}/members`, null, token);
                currentMyListItems = Array.isArray(items) ? items : [];
                currentMembers = Array.isArray(members) ? members : [];
                renderMyListContent(selectedList, currentMyListItems, currentMembers);
            } catch (error) {
                currentMyListItems = [];
                currentMembers = [];
                document.getElementById('my-list-content').innerHTML = `<div class="empty-state">${error.message}</div>`;
            }
        }

        async function openMyLists(forceListId = null) {
            setWorkspaceSection('my-lists');
            if (!currentLists.length) {
                await refreshDashboard();
            }
            await renderMyListsSection(forceListId);
        }

        function focusMyListEditForm() {
            editingMyListDetails = true;
            renderMyListsSection(myListId);
            const input = document.getElementById('my-list-name-input');
            if (input) {
                input.focus();
                input.select();
            }
        }

        function focusMyListQuickAddForm() {
            showingMyListQuickAddForm = true;
            renderMyListsSection(myListId);
            const input = document.getElementById('quick-add-item-name');
            if (input) {
                input.focus();
            }
        }

        function hideMyListQuickAddForm() {
            showingMyListQuickAddForm = false;
            renderMyListsSection(myListId);
        }

        function handleMyListInlineKeydown(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        }

        async function openNotifications() {
            setWorkspaceSection('notifications');
            if (!currentLists.length || !currentNotifications.length) {
                await refreshDashboard();
            } else {
                renderNotificationsFeed(currentNotifications, currentLists);
            }
        }

        async function openSharedWithMe() {
            setWorkspaceSection('shared');
            if (!currentLists.length) {
                await refreshDashboard();
            }
            await renderSharedSection();
        }

        function onMyListPickerChange() {
            const picker = document.getElementById('my-list-picker');
            myListId = picker.value;
            renderMyListsSection();
        }

        function openControlCenterForList(selectedListId) {
            listId = selectedListId;
            setWorkspaceSection('control-center');
        }

        function openMembersModal(selectedListId) {
            listId = selectedListId;
            const modal = document.getElementById('members-modal');
            modal.classList.remove('hidden');
            loadListMembersModal();
        }

        function closeMembersModal() {
            const modal = document.getElementById('members-modal');
            modal.classList.add('hidden');
            document.getElementById('members-modal-add-form').classList.add('hidden');
        }

        async function loadListMembersModal() {
            const loadingDiv = document.getElementById('members-modal-loading');
            const listDiv = document.getElementById('members-modal-list');
            
            if (!listId) {
                listDiv.innerHTML = '<p style="color: red;">Eroare: nicio listă selectată.</p>';
                return;
            }

            loadingDiv.classList.remove('hidden');
            listDiv.innerHTML = '';

            try {
                const members = await makeRequest('GET', `/lists/${listId}/members`, null, token);
                currentMembers = Array.isArray(members) ? members : [];
                loadingDiv.classList.add('hidden');
                renderMembersModal(currentMembers);
            } catch (error) {
                loadingDiv.classList.add('hidden');
                listDiv.innerHTML = `<p style="color: red;">Eroare: ${error.message}</p>`;
            }
        }

        function renderMembersModal(members) {
            const container = document.getElementById('members-modal-list');
            
            if (!members || members.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #6d7a72;">Nu sunt utilizatori momentan.</p>';
                return;
            }

            container.innerHTML = members
                .map((member) => {
                    const isOwner = member.role === 'owner';
                    return `
                        <div class="member-item">
                            <div class="member-info">
                                <strong>${escapeHtml(member.email || 'Unknown')}</strong>
                                <small>Rol: <strong>${escapeHtml(member.role || 'viewer')}</strong>${isOwner ? ' (Proprietar)' : ''}</small>
                            </div>
                            ${!isOwner ? `<button type="button" class="danger-button" onclick="removeMemberModal('${member.user_id || member.id}')">Șterge</button>` : '<span style="color: #6d7a72; font-size: 13px;">Nu poate fi șters</span>'}
                        </div>
                    `;
                })
                .join('');
        }

        async function removeMemberModal(userId) {
            if (!confirm('Ești sigur că vrei să elimini acest utilizator?')) {
                return;
            }

            try {
                await makeRequest('DELETE', `/lists/${listId}/members/${userId}`, null, token);
                updateStatus('Utilizator eliminat cu succes!');
                
                // Reîncarcă lista de membri din modal
                await loadListMembersModal();
                
                // Reîncarcă și secțiunea "My Lists" pentru a actualiza contorul
                if (myListId === listId) {
                    await renderMyListsSection(myListId);
                }
            } catch (error) {
                alert(`Eroare la eliminarea utilizatorului: ${error.message}`);
            }
        }

        function toggleAddMemberFormModal() {
            const form = document.getElementById('members-modal-add-form');
            form.classList.toggle('hidden');
            
            if (!form.classList.contains('hidden')) {
                document.getElementById('modal-share-email').focus();
            }
        }

        async function submitAddMemberModal() {
            const email = document.getElementById('modal-share-email').value.trim();
            const role = document.getElementById('modal-share-role').value;

            if (!email) {
                alert('Te rog introdu un email.');
                return;
            }

            try {
                await makeRequest('POST', `/lists/${listId}/share`, { user_email: email, role }, token);
                updateStatus('Utilizator adăugat cu succes!');
                
                document.getElementById('modal-share-email').value = '';
                document.getElementById('modal-share-role').value = 'editor';
                toggleAddMemberFormModal();
                
                // Reîncarcă lista de membri din modal
                await loadListMembersModal();
                
                // Reîncarcă și secțiunea "My Lists" pentru a actualiza contorul
                if (myListId === listId) {
                    await renderMyListsSection(myListId);
                }
            } catch (error) {
                alert(`Eroare la adăugarea utilizatorului: ${error.message}`);
            }
        }
