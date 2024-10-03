        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwNJFg4N6xewWBfCzruMzCcfP1XQvG6i2b10Y7jPT7LAt4wJQ3aY9fPqjrWf4OunexMaQ/exec';
        let cachedResources = null;
        let categories = [];
        let currentCategory = 'All';
        const PAGE_SIZE = 12;
        let currentPage = 1;

        function showLoading(show) {
            document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
        }

        async function fetchResources(forceRefresh = false) {
            if (!forceRefresh) {
                const cachedData = localStorage.getItem('resourcesCache');
                const lastUpdated = localStorage.getItem('lastUpdated');
                if (cachedData && lastUpdated) {
                    const parsedData = JSON.parse(cachedData);
                    const cacheAge = Date.now() - parseInt(lastUpdated);
                    if (cacheAge < 3600000) { // Cache is less than 1 hour old
                        cachedResources = parsedData;
                        processResources();
                        return;
                    }
                }
            }

            showLoading(true);
            try {
                const response = await fetch(`${SCRIPT_URL}?action=read`);
                const data = await response.json();
                cachedResources = data;
                localStorage.setItem('resourcesCache', JSON.stringify(data));
                localStorage.setItem('lastUpdated', Date.now().toString());
                processResources();
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to fetch resources. Please try again.');
            } finally {
                showLoading(false);
            }
        }

        function processResources() {
            categories = ['All', ...new Set(cachedResources.map(resource => resource.Category))];
            renderCategoryFilter();
            filterResources();
        }

        function renderCategoryFilter() {
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = categories.map(category => 
                `<button class="category-button ${category === currentCategory ? 'active' : ''}" 
                 onclick="selectCategory('${category}')">${category}</button>`
            ).join('');
        }

        function selectCategory(category) {
            currentCategory = category;
            currentPage = 1;
            renderCategoryFilter();
            filterResources();
        }

        function filterResources() {
            const filteredResources = currentCategory === 'All' 
                ? cachedResources 
                : cachedResources.filter(resource => resource.Category === currentCategory);
            renderResources(filteredResources.slice(0, PAGE_SIZE));
            document.getElementById('loadMoreButton').style.display = 
                filteredResources.length > PAGE_SIZE ? 'block' : 'none';
        }

        function renderResources(data) {
            const resourceList = document.getElementById('resourceList');
            resourceList.innerHTML = ''; // Clear existing resources
            data.forEach(resource => {
                const div = document.createElement('div');
                div.className = 'resource-card';
                div.innerHTML = `
                    <h3>${resource.Name}</h3>
                    <p>${resource.Description}</p>
                    <span class="category-tag">${resource.Category}</span>
                `;
                div.addEventListener('click', () => window.open(resource.URL, '_blank'));
                resourceList.appendChild(div);
            });
        }

        function loadMore() {
            currentPage++;
            const filteredResources = currentCategory === 'All' 
                ? cachedResources 
                : cachedResources.filter(resource => resource.Category === currentCategory);
            const startIndex = (currentPage - 1) * PAGE_SIZE;
            const endIndex = startIndex + PAGE_SIZE;
            renderResources(filteredResources.slice(startIndex, endIndex));
            document.getElementById('loadMoreButton').style.display = 
                filteredResources.length > endIndex ? 'block' : 'none';
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('loadMoreButton').addEventListener('click', loadMore);
            document.getElementById('refreshButton').addEventListener('click', () => fetchResources(true));

            // Initial fetch
            fetchResources();
        });
